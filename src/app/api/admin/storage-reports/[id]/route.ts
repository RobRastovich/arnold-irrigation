import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { utcDate } from '@/lib/storage-report/loadReport'
import type { ReservoirCode } from '@/lib/storage-report/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const report = await prisma.storageReport.findUnique({
      where: { id: params.id },
      include: { openingBalances: true, instreamLeases: true, overrides: true, result: true },
    })
    if (!report) return NextResponse.json({ error: 'Storage report not found' }, { status: 404 })
    const [waterRights, pumps] = await Promise.all([
      prisma.districtWaterRight.findMany({ orderBy: [{ rightName: 'asc' }, { seasonIndex: 'asc' }] }),
      prisma.pumpSeasonMonth.findMany({ where: { waterYear: report.waterYear }, orderBy: { month: 'asc' } }),
    ])
    return NextResponse.json({ ...report, waterRights, pumps })
  } catch (error) {
    console.error('Error fetching storage report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const data: Record<string, unknown> = {}
    if (body.startDate) data.startDate = utcDate(body.startDate)
    if (body.endDate) data.endDate = utcDate(body.endDate)
    if (body.dateCode != null) data.dateCode = Number(body.dateCode)
    if (body.status) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes
    if (body.dataQuality) data.dataQuality = body.dataQuality
    if (body.useLegacyCpInflow != null) data.useLegacyCpInflow = Boolean(body.useLegacyCpInflow)
    if (body.crescentOctMinContentsAf != null) data.crescentOctMinContentsAf = Number(body.crescentOctMinContentsAf)

    await prisma.storageReport.update({ where: { id: params.id }, data })

    if (Array.isArray(body.openingBalances)) {
      for (const row of body.openingBalances) {
        await prisma.storageReportOpeningBalance.upsert({
          where: {
            reportId_district_reservoir: {
              reportId: params.id,
              district: row.district,
              reservoir: row.reservoir as ReservoirCode,
            },
          },
          update: { acreFeet: Number(row.acreFeet) },
          create: {
            reportId: params.id,
            district: row.district,
            reservoir: row.reservoir,
            acreFeet: Number(row.acreFeet),
          },
        })
      }
    }

    if (Array.isArray(body.instreamLeases)) {
      for (const row of body.instreamLeases) {
        if (row.id) {
          await prisma.instreamLease.update({
            where: { id: row.id },
            data: { district: row.district, kind: row.kind, cfs: Number(row.cfs ?? 0), acres: row.acres != null ? Number(row.acres) : null, notes: row.notes },
          })
        } else {
          await prisma.instreamLease.create({
            data: {
              reportId: params.id,
              district: row.district,
              kind: row.kind,
              cfs: Number(row.cfs ?? 0),
              acres: row.acres != null ? Number(row.acres) : null,
              notes: row.notes,
            },
          })
        }
      }
    }

    if (Array.isArray(body.overrides)) {
      for (const row of body.overrides) {
        await prisma.storageReportOverride.upsert({
          where: { reportId_key: { reportId: params.id, key: row.key } },
          update: { value: Number(row.value), reason: row.reason, createdBy: userName },
          create: {
            reportId: params.id,
            key: row.key,
            value: Number(row.value),
            reason: row.reason,
            createdBy: userName,
          },
        })
      }
    }

    if (Array.isArray(body.pumps)) {
      const report = await prisma.storageReport.findUnique({ where: { id: params.id } })
      if (report) {
        for (const row of body.pumps) {
          await prisma.pumpSeasonMonth.upsert({
            where: { waterYear_month: { waterYear: report.waterYear, month: Number(row.month) } },
            update: {
              pumpedAf: Number(row.pumpedAf ?? 0),
              deliveriesAf: Number(row.deliveriesAf ?? 0),
              beginningMeter: row.beginningMeter != null ? Number(row.beginningMeter) : null,
              endingMeter: row.endingMeter != null ? Number(row.endingMeter) : null,
            },
            create: {
              waterYear: report.waterYear,
              month: Number(row.month),
              pumpedAf: Number(row.pumpedAf ?? 0),
              deliveriesAf: Number(row.deliveriesAf ?? 0),
              beginningMeter: row.beginningMeter != null ? Number(row.beginningMeter) : null,
              endingMeter: row.endingMeter != null ? Number(row.endingMeter) : null,
            },
          })
        }
      }
    }

    const full = await prisma.storageReport.findUnique({
      where: { id: params.id },
      include: { openingBalances: true, instreamLeases: true, overrides: true, result: true },
    })
    const [waterRights, pumps] = await Promise.all([
      prisma.districtWaterRight.findMany({ orderBy: [{ rightName: 'asc' }, { seasonIndex: 'asc' }] }),
      prisma.pumpSeasonMonth.findMany({ where: { waterYear: full?.waterYear }, orderBy: { month: 'asc' } }),
    ])
    clearCurrentUserId()
    return NextResponse.json({ ...full, waterRights, pumps })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error updating storage report:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)
    await prisma.storageReport.delete({ where: { id: params.id } })
    clearCurrentUserId()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error deleting storage report:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
