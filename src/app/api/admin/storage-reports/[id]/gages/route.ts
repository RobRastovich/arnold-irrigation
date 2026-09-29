import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { assembleDailyGrid, dateOnly, utcDate } from '@/lib/storage-report/assemble'
import { loadCapacityTables } from '@/lib/storage-report/loadReport'
import { parseGageCsv } from '@/lib/storage-report/owrd'
import type { GageValueSource, GageValueUnit } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const report = await prisma.storageReport.findUnique({ where: { id: params.id } })
    if (!report) return NextResponse.json({ error: 'Storage report not found' }, { status: 404 })

    const startDate = dateOnly(report.startDate)
    const endDate = dateOnly(report.endDate)
    const [capacity, stations] = await Promise.all([
      loadCapacityTables(),
      prisma.gageStation.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    ])
    const values = await prisma.gageDailyValue.findMany({
      where: {
        date: { gte: utcDate(startDate), lte: utcDate(endDate) },
        stationId: { in: stations.map((s) => s.id) },
      },
      include: { station: true },
    })
    const daily = assembleDailyGrid(
      startDate,
      endDate,
      values.map((v) => ({
        stationNbr: v.station.stationNbr,
        seriesKey: v.station.seriesKey,
        date: dateOnly(v.date),
        value: v.value,
        unit: v.unit,
        source: v.source,
      })),
      capacity
    )
    const missingDays = daily.filter((row) => (row.missing?.length ?? 0) > 0).length
    return NextResponse.json({ stations, daily, missingDays, dataQuality: report.dataQuality })
  } catch (error) {
    console.error('Error loading report gages:', error)
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

    const stations = await prisma.gageStation.findMany()
    const byNbr = Object.fromEntries(stations.map((s) => [s.stationNbr, s]))
    const byKey = Object.fromEntries(stations.map((s) => [s.seriesKey, s]))

    let points = Array.isArray(body.rows) ? body.rows : []
    if (typeof body.csv === 'string') {
      points = parseGageCsv(body.csv, body.stationNbr)
    }

    let upserts = 0
    for (const point of points) {
      const station = byNbr[point.stationNbr] || byKey[point.seriesKey]
      if (!station || point.date == null || point.value == null) continue
      const unit = (point.unit || (station.role === 'RESERVOIR' ? 'STAGE_FT' : station.role === 'EVAP' ? 'EVAP_IN' : 'CFS')) as GageValueUnit
      await prisma.gageDailyValue.upsert({
        where: { stationId_date_unit: { stationId: station.id, date: utcDate(String(point.date).slice(0, 10)), unit } },
        update: {
          value: Number(point.value),
          source: (point.source || 'MANUAL') as GageValueSource,
          publishedStatus: point.publishedStatus || 'Corrected',
        },
        create: {
          stationId: station.id,
          date: utcDate(String(point.date).slice(0, 10)),
          value: Number(point.value),
          unit,
          source: (point.source || 'MANUAL') as GageValueSource,
          publishedStatus: point.publishedStatus || 'Corrected',
        },
      })
      upserts++
    }

    if (body.markCorrected) {
      await prisma.storageReport.update({
        where: { id: params.id },
        data: { dataQuality: 'CORRECTED' },
      })
    }

    clearCurrentUserId()
    return NextResponse.json({ upserts })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error saving gage values:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
