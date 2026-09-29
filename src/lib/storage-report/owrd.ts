import { parse } from 'csv-parse/sync'
import { contentsFromStage } from './capacity'
import type { CapacityPoint } from './types'

export interface FetchedGagePoint {
  stationNbr: string
  date: string
  value: number
  unit: 'CFS' | 'STAGE_FT' | 'CONTENTS_AF' | 'EVAP_IN'
  publishedStatus?: string
  estimated?: boolean
  revised?: boolean
  source: 'OWRD' | 'USBR' | 'MANUAL' | 'HYDROMET'
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function usgsParam(stationNbr: string): { parameterCd: string; unit: FetchedGagePoint['unit'] } | null {
  if (['14053500', '14056000', '14059500'].includes(stationNbr)) {
    return { parameterCd: '00062', unit: 'STAGE_FT' }
  }
  if (!/^\d+$/.test(stationNbr)) return null
  return { parameterCd: '00060', unit: 'CFS' }
}

/** USGS NWIS daily values — same station numbers OWRD publishes. Labeled provisional. */
async function fetchUsgsDaily(stationNbr: string, startDate: string, endDate: string): Promise<FetchedGagePoint[]> {
  const param = usgsParam(stationNbr)
  if (!param) return []
  const url = `https://waterservices.usgs.gov/nwis/dv/?format=json&sites=${stationNbr}&startDT=${startDate}&endDT=${endDate}&parameterCd=${param.parameterCd}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  const series = json?.value?.timeSeries ?? []
  const points: FetchedGagePoint[] = []
  for (const ts of series) {
    for (const v of ts?.values?.[0]?.value ?? []) {
      if (v.value == null || v.value === '') continue
      points.push({
        stationNbr,
        date: String(v.dateTime).slice(0, 10),
        value: Number(v.value),
        unit: param.unit,
        publishedStatus: v.qualifiers?.includes('P') ? 'Provisional' : 'Published',
        source: 'OWRD',
      })
    }
  }
  return points
}

export async function fetchPublishedDaily(
  stationNbr: string,
  startDate: string,
  endDate: string
): Promise<FetchedGagePoint[]> {
  return fetchUsgsDaily(stationNbr, startDate, endDate)
}

export function parseGageCsv(csvText: string, fallbackStation?: string): FetchedGagePoint[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  const points: FetchedGagePoint[] = []
  for (const row of records) {
    const keys = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), v]))
    const stationNbr = keys.station_nbr || keys.station || fallbackStation
    const dateRaw = keys.record_date || keys.date || keys.datetime
    const flow = keys.mean_daily_flow_cfs || keys.cfs || keys.flow
    const stage = keys.midnight_stage_ft || keys.stage || keys.elevation
    const contents = keys.contents_af || keys.acre_feet || keys.contents
    const evap = keys.evap_in || keys.evaporation || keys.pan_inches
    if (!stationNbr || !dateRaw) continue

    let date = dateRaw
    if (/^\d+(\.\d+)?$/.test(dateRaw)) {
      const serial = Math.floor(Number(dateRaw))
      const utc = new Date(Date.UTC(1899, 11, 30))
      utc.setUTCDate(utc.getUTCDate() + serial)
      date = iso(utc)
    } else {
      const parsed = new Date(dateRaw)
      if (!Number.isNaN(parsed.getTime())) date = iso(parsed)
    }

    const publishedStatus = keys.published_status || keys.status
    const estimated = String(keys.estimated || '').toLowerCase() === 'true' || keys.estimated === '1'
    const revised = String(keys.revised || '').toLowerCase() === 'true' || keys.revised === '1'
    const source: FetchedGagePoint['source'] = keys.source === 'HYDROMET' ? 'HYDROMET' : 'MANUAL'

    const push = (value: string | undefined, unit: FetchedGagePoint['unit']) => {
      if (value == null || value === '') return
      const n = Number(value)
      if (Number.isNaN(n)) return
      points.push({ stationNbr, date, value: n, unit, publishedStatus, estimated, revised, source })
    }
    push(flow, 'CFS')
    push(stage, 'STAGE_FT')
    push(contents, 'CONTENTS_AF')
    push(evap, 'EVAP_IN')
  }
  return points
}

export function contentsFromStageSeries(
  stage: number,
  reservoir: 'cranePrairie' | 'wickiup' | 'crescentLake',
  tables: { cranePrairie: CapacityPoint[]; wickiup: CapacityPoint[]; crescentLake: CapacityPoint[] }
): number {
  return contentsFromStage(stage, tables[reservoir])
}

void iso
