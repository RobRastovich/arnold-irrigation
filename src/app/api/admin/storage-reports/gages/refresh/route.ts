import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { fetchPublishedDaily } from '@/lib/storage-report/owrd'
import { utcDate } from '@/lib/storage-report/loadReport'
import type { GageValueUnit } from '@prisma/client'

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

    const stations = await prisma.gageStation.findMany({
      where: {
        isActive: true,
        source: 'OWRD',
        ...(Array.isArray(body.stationNbrs) && body.stationNbrs.length
          ? { stationNbr: { in: body.stationNbrs } }
          : {}),
      },
    })

    const results: { stationNbr: string; imported: number; error?: string }[] = []
    for (const station of stations) {
      try {
        const points = await fetchPublishedDaily(station.stationNbr, startDate, endDate)
        let imported = 0
        for (const point of points) {
          await prisma.gageDailyValue.upsert({
            where: {
              stationId_date_unit: {
                stationId: station.id,
                date: utcDate(point.date),
                unit: point.unit as GageValueUnit,
              },
            },
            update: {
              value: point.value,
              publishedStatus: point.publishedStatus || 'Provisional',
              source: 'OWRD',
            },
            create: {
              stationId: station.id,
              date: utcDate(point.date),
              value: point.value,
              unit: point.unit as GageValueUnit,
              publishedStatus: point.publishedStatus || 'Provisional',
              source: 'OWRD',
            },
          })
          imported++
        }
        results.push({ stationNbr: station.stationNbr, imported })
      } catch (error: any) {
        results.push({ stationNbr: station.stationNbr, imported: 0, error: error.message })
      }
    }

    clearCurrentUserId()
    return NextResponse.json({
      dataQuality: 'PROVISIONAL',
      note: 'OWRD/USGS daily values are provisional. Official monthly reports require corrected / shifted series via CSV upload.',
      results,
    })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error refreshing gages:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
