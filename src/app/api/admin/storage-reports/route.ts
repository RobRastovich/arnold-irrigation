import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { ACCOUNT_DISTRICTS } from '@/lib/storage-report/constants'
import { emptyOpeningBalances } from '@/lib/storage-report/assemble'
import {
  copyDefaultInstream,
  copyEndingBalances,
  createOpeningRows,
  periodDateCode,
  utcDate,
  waterYearForDate,
} from '@/lib/storage-report/loadReport'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reports = await prisma.storageReport.findMany({
      include: { result: true },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(reports.map((report) => ({
      ...report,
      startDate: report.startDate.toISOString().slice(0, 10),
      endDate: report.endDate.toISOString().slice(0, 10),
      reconciled: report.result?.reconciled ?? false,
      maxAbsDiffAf: report.result?.maxAbsDiffAf ?? null,
      period: `${report.startDate.toISOString().slice(0, 10)} – ${report.endDate.toISOString().slice(0, 10)}`,
    })))
  } catch (error) {
    console.error('Error fetching storage reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const startDate = String(body.startDate || '')
    const endDate = String(body.endDate || '')
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const dateCode = body.dateCode != null ? Number(body.dateCode) : periodDateCode(startDate, endDate)
    const waterYear = waterYearForDate(endDate)

    const report = await prisma.storageReport.create({
      data: {
        startDate: utcDate(startDate),
        endDate: utcDate(endDate),
        dateCode,
        waterYear,
        notes: body.notes || null,
        dataQuality: body.dataQuality === 'CORRECTED' ? 'CORRECTED' : 'PROVISIONAL',
        useLegacyCpInflow: body.useLegacyCpInflow !== false,
        crescentOctMinContentsAf: body.crescentOctMinContentsAf != null ? Number(body.crescentOctMinContentsAf) : 5652.54,
      },
    })

    let opening = emptyOpeningBalances()
    if (body.copyFromId) {
      opening = await copyEndingBalances(body.copyFromId)
    } else {
      const previous = await prisma.storageReport.findFirst({
        where: { status: 'FINAL', endDate: { lt: utcDate(startDate) } },
        orderBy: { endDate: 'desc' },
      })
      if (previous) opening = await copyEndingBalances(previous.id)
    }

    if (body.openingBalances) {
      opening = body.openingBalances
    }

    await createOpeningRows(report.id, opening)
    await copyDefaultInstream(report.id)

    if (body.overrides && typeof body.overrides === 'object') {
      await prisma.storageReportOverride.createMany({
        data: Object.entries(body.overrides).map(([key, value]) => ({
          reportId: report.id,
          key,
          value: Number(value),
          createdBy: userName,
        })),
      })
    }

    const full = await prisma.storageReport.findUnique({
      where: { id: report.id },
      include: { openingBalances: true, instreamLeases: true, overrides: true, result: true },
    })

    clearCurrentUserId()
    void ACCOUNT_DISTRICTS
    return NextResponse.json(full, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error creating storage report:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
