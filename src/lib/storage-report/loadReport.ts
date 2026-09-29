import { prisma } from '@/lib/db'
import { ACCOUNT_DISTRICTS, DEFAULT_CANAL_LOSS, type ReservoirCode } from '@/lib/storage-report/constants'
import { assembleDailyGrid, dateOnly, emptyOpeningBalances, utcDate } from '@/lib/storage-report/assemble'
import { runReport } from '@/lib/storage-report/runReport'
import { periodDateCode } from '@/lib/storage-report/decreeSeason'
import { waterYearForDate } from '@/lib/storage-report/units'
import type { CapacityTables, OpeningBalances, ReportInputs } from '@/lib/storage-report/types'

const reportInclude = {
  openingBalances: true,
  instreamLeases: true,
  overrides: true,
  result: true,
} as const

export async function loadCapacityTables(): Promise<CapacityTables> {
  const points = await prisma.reservoirCapacityPoint.findMany({ orderBy: { elevation: 'asc' } })
  const tables: CapacityTables = { cranePrairie: [], wickiup: [], crescentLake: [] }
  for (const point of points) {
    const row = { elevation: point.elevation, acreFeet: point.acreFeet, surfaceAcres: point.surfaceAcres ?? undefined }
    if (point.reservoir === 'CRANE_PRAIRIE') tables.cranePrairie.push(row)
    else if (point.reservoir === 'WICKIUP') tables.wickiup.push(row)
    else tables.crescentLake.push(row)
  }
  return tables
}

export async function loadMaxRightTable(): Promise<Record<string, number[]>> {
  const rows = await prisma.districtWaterRight.findMany()
  const table: Record<string, number[]> = {}
  for (const row of rows) {
    if (!table[row.rightName]) table[row.rightName] = [0, 0, 0, 0, 0]
    table[row.rightName][row.seasonIndex] = row.maxCfs
  }
  return table
}

function instreamFromLeases(leases: { district: string; kind: string; cfs: number; acres: number | null }[]) {
  const instream = {
    directAcres: {} as Record<string, number>,
    leasesCfs: {} as Record<string, number>,
    permanentCfs: {} as Record<string, number>,
  }
  for (const lease of leases) {
    if (lease.kind === 'DIRECT_ACRES') instream.directAcres[lease.district] = lease.acres ?? 0
    else if (lease.kind === 'PERMANENT') instream.permanentCfs[lease.district] = lease.cfs
    else instream.leasesCfs[lease.district] = lease.cfs
  }
  return instream
}

export async function buildReportInputs(reportId: string): Promise<ReportInputs> {
  const report = await prisma.storageReport.findUnique({
    where: { id: reportId },
    include: reportInclude,
  })
  if (!report) throw new Error('Storage report not found')

  const startDate = dateOnly(report.startDate)
  const endDate = dateOnly(report.endDate)
  const [capacity, maxRightCfsBySeason, stations, pumps] = await Promise.all([
    loadCapacityTables(),
    loadMaxRightTable(),
    prisma.gageStation.findMany({ where: { isActive: true } }),
    prisma.pumpSeasonMonth.findMany({ where: { waterYear: report.waterYear } }),
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

  const opening = emptyOpeningBalances()
  for (const row of report.openingBalances) {
    if (!opening[row.district]) opening[row.district] = {}
    opening[row.district][row.reservoir as ReservoirCode] = row.acreFeet
  }

  const overrides: Record<string, number> = {}
  for (const row of report.overrides) overrides[row.key] = row.value

  return {
    startDate,
    endDate,
    dateCode: report.dateCode,
    useLegacyCpInflow: report.useLegacyCpInflow,
    openingBalances: opening,
    daily,
    instream: instreamFromLeases(report.instreamLeases),
    maxRightCfsBySeason,
    canalLoss: DEFAULT_CANAL_LOSS,
    pumps: {
      waterYear: report.waterYear,
      months: pumps.map((p) => ({ month: p.month, pumpedAf: p.pumpedAf, deliveriesAf: p.deliveriesAf })),
    },
    overrides,
    capacity,
    crescentOctMinContentsAf: report.crescentOctMinContentsAf ?? undefined,
  }
}

export async function runAndSave(reportId: string) {
  const report = await prisma.storageReport.findUnique({ where: { id: reportId } })
  if (!report) throw new Error('Storage report not found')
  const inputs = await buildReportInputs(reportId)
  const result = runReport(inputs, report.dataQuality as 'PROVISIONAL' | 'CORRECTED')
  const maxAbsDiffAf = Math.max(
    Math.abs(result.page3.cranePrairie.accountingDiffAf),
    Math.abs(result.page3.wickiup.accountingDiffAf),
    Math.abs(result.page3.crescent.accountingDiffAf)
  )
  const saved = await prisma.storageReportResult.upsert({
    where: { reportId },
    update: {
      page1: result.page1 as object,
      page2: result.page2 as object,
      page3: result.page3 as object,
      reconciled: result.page3.reconciled,
      maxAbsDiffAf,
      dataQuality: result.dataQuality,
      runAt: new Date(),
    },
    create: {
      reportId,
      page1: result.page1 as object,
      page2: result.page2 as object,
      page3: result.page3 as object,
      reconciled: result.page3.reconciled,
      maxAbsDiffAf,
      dataQuality: result.dataQuality,
    },
  })
  if (result.page3.reconciled && report.status === 'DRAFT') {
    await prisma.storageReport.update({
      where: { id: reportId },
      data: { status: 'RECONCILED' },
    })
  }
  return { result, saved }
}

export async function copyDefaultInstream(reportId: string) {
  const defaults = await prisma.instreamLease.findMany({ where: { reportId: null } })
  if (defaults.length === 0) return
  await prisma.instreamLease.createMany({
    data: defaults.map((row) => ({
      reportId,
      district: row.district,
      kind: row.kind,
      cfs: row.cfs,
      acres: row.acres,
      notes: row.notes,
    })),
  })
}

export async function copyEndingBalances(fromReportId: string): Promise<OpeningBalances> {
  const result = await prisma.storageReportResult.findUnique({ where: { reportId: fromReportId } })
  const opening = emptyOpeningBalances()
  if (!result?.page3 || typeof result.page3 !== 'object') return opening
  const page3 = result.page3 as {
    cranePrairie?: { rows?: { district: string; endingAf: number }[] }
    wickiup?: { rows?: { district: string; endingAf: number }[] }
    crescent?: { rows?: { district: string; endingAf: number }[] }
  }
  const apply = (rows: { district: string; endingAf: number }[] | undefined, reservoir: ReservoirCode) => {
    for (const row of rows ?? []) {
      if (!opening[row.district]) opening[row.district] = {}
      opening[row.district][reservoir] = row.endingAf
    }
  }
  apply(page3.cranePrairie?.rows, 'CRANE_PRAIRIE')
  apply(page3.wickiup?.rows, 'WICKIUP')
  apply(page3.crescent?.rows, 'CRESCENT_LAKE')
  return opening
}

export async function createOpeningRows(reportId: string, opening: OpeningBalances) {
  const data = []
  for (const district of ACCOUNT_DISTRICTS) {
    for (const reservoir of ['CRANE_PRAIRIE', 'WICKIUP', 'CRESCENT_LAKE'] as ReservoirCode[]) {
      data.push({
        reportId,
        district,
        reservoir,
        acreFeet: opening[district]?.[reservoir] ?? 0,
      })
    }
  }
  await prisma.storageReportOpeningBalance.createMany({ data })
}

export { periodDateCode, utcDate, waterYearForDate, reportInclude }
