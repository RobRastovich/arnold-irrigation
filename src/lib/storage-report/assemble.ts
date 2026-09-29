import { ACCOUNT_DISTRICTS, DEFAULT_CANAL_LOSS, type ReservoirCode } from './constants'
import { contentsFromStage } from './capacity'
import { periodDateCode } from './decreeSeason'
import { GAGE_CATALOG } from './stations'
import type { CapacityTables, DailyRawRow, OpeningBalances, ReportInputs } from './types'
import { eachDateInclusive, toIsoDate, waterYearForDate } from './units'

export function dateOnly(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10)
  return toIsoDate(value)
}

export function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

const EMPTY_ROW = (date: string): DailyRawRow => ({
  date,
  rockSpringsCfs: 0,
  snowCreekCfs: 0,
  cultusRiverCfs: 0,
  cultusCkCfs: 0,
  deerCkCfs: 0,
  quinnRiverCfs: 0,
  charltonCkCfs: 0,
  descBlwCraneCfs: 0,
  descBlwWickiupCfs: 0,
  crescentCkCfs: 0,
  descAtBenhamCfs: 0,
  arnoldCfs: 0,
  coidCanalCfs: 0,
  dcmidCfs: 0,
  nuidCfs: 0,
  northCanalCfs: 0,
  swalleyCfs: 0,
  lonePineNetCfs: 0,
  deboCfs: 0,
  nuidSpillCfs: 0,
  missing: [],
})

export interface StationValue {
  stationNbr: string
  seriesKey: string
  date: string
  value: number
  unit: string
  source: string
}

export function assembleDailyGrid(
  startDate: string,
  endDate: string,
  values: StationValue[],
  capacity: CapacityTables,
  stations = GAGE_CATALOG
): DailyRawRow[] {
  const byKey = new Map<string, StationValue>()
  for (const value of values) {
    byKey.set(`${value.seriesKey}|${value.date}|${value.unit}`, value)
  }
  const lookup = (seriesKey: string, date: string, unit: string) =>
    byKey.get(`${seriesKey}|${date}|${unit}`)?.value

  return eachDateInclusive(startDate, endDate).map((date) => {
    const row = EMPTY_ROW(date)
    const missing: string[] = []

    for (const station of stations) {
      if (station.seriesKey.endsWith('Cfs')) {
        const value = lookup(station.seriesKey, date, 'CFS')
        if (value != null) {
          ;(row as unknown as Record<string, number>)[station.seriesKey] = value
        } else if (station.defaultCfs != null) {
          ;(row as unknown as Record<string, number>)[station.seriesKey] = station.defaultCfs
        } else if (!station.optional) {
          missing.push(station.seriesKey)
        }
      } else if (station.seriesKey.endsWith('Elev')) {
        const stage = lookup(station.seriesKey, date, 'STAGE_FT')
        const reservoir =
          station.seriesKey === 'cranePrairieElev' ? 'cranePrairie'
          : station.seriesKey === 'wickiupElev' ? 'wickiup'
          : 'crescentLake'
        const contentsKey =
          station.seriesKey === 'cranePrairieElev' ? 'cranePrairieContentsAf'
          : station.seriesKey === 'wickiupElev' ? 'wickiupContentsAf'
          : 'crescentContentsAf'
        const contents = lookup(station.seriesKey, date, 'CONTENTS_AF')
        if (stage != null) {
          ;(row as unknown as Record<string, number>)[station.seriesKey] = stage
          ;(row as unknown as Record<string, number>)[contentsKey] =
            contents ?? contentsFromStage(stage, capacity[reservoir])
        } else if (contents != null) {
          ;(row as unknown as Record<string, number>)[contentsKey] = contents
        } else {
          missing.push(station.seriesKey)
        }
      } else if (station.seriesKey === 'wickiupEvapIn') {
        const evap = lookup(station.seriesKey, date, 'EVAP_IN')
        if (evap != null) row.wickiupEvapIn = evap
        else missing.push(station.seriesKey)
      }
    }

    row.missing = missing
    return row
  })
}

export function emptyOpeningBalances(): OpeningBalances {
  const balances: OpeningBalances = {}
  for (const district of ACCOUNT_DISTRICTS) {
    balances[district] = { CRANE_PRAIRIE: 0, WICKIUP: 0, CRESCENT_LAKE: 0 }
  }
  return balances
}

export function openingFromRows(
  rows: { district: string; reservoir: string; acreFeet: number }[]
): OpeningBalances {
  const balances = emptyOpeningBalances()
  for (const row of rows) {
    if (!balances[row.district]) balances[row.district] = {}
    balances[row.district][row.reservoir as ReservoirCode] = row.acreFeet
  }
  return balances
}

export function inputsFromParts(args: {
  startDate: string
  endDate: string
  dateCode?: number
  useLegacyCpInflow?: boolean
  openingBalances: OpeningBalances
  daily: DailyRawRow[]
  instream: ReportInputs['instream']
  maxRightCfsBySeason: Record<string, number[]>
  canalLoss?: Record<string, number>
  pumps: ReportInputs['pumps']
  overrides: Record<string, number>
  capacity: CapacityTables
  crescentOctMinContentsAf?: number
}): ReportInputs {
  return {
    startDate: args.startDate,
    endDate: args.endDate,
    dateCode: args.dateCode ?? periodDateCode(args.startDate, args.endDate),
    useLegacyCpInflow: args.useLegacyCpInflow ?? true,
    openingBalances: args.openingBalances,
    daily: args.daily,
    instream: args.instream,
    maxRightCfsBySeason: args.maxRightCfsBySeason,
    canalLoss: args.canalLoss ?? DEFAULT_CANAL_LOSS,
    pumps: args.pumps,
    overrides: args.overrides,
    capacity: args.capacity,
    crescentOctMinContentsAf: args.crescentOctMinContentsAf,
  }
}

export { waterYearForDate }
