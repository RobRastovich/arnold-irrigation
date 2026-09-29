import { CFS_TO_AF } from './constants'

/** Sum of mean daily CFS over N days → acre-feet, using the workbook constant 1.983471. */
export function cfsDaysToAf(cfsSum: number): number {
  return cfsSum * CFS_TO_AF
}

export function afToAvgCfs(acreFeet: number, days: number): number {
  if (days <= 0) return 0
  return acreFeet / (days * CFS_TO_AF)
}

export function cfsToAfForPeriod(cfs: number, days: number): number {
  return cfs * days * CFS_TO_AF
}

export function eachDateInclusive(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    dates.push(toIsoDate(new Date(t)))
  }
  return dates
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function daysInPeriod(startDate: string, endDate: string): number {
  return eachDateInclusive(startDate, endDate).length
}

/** Oregon irrigation water year: Oct 1 – Sep 30, named by the calendar year of Sep 30. */
export function waterYearForDate(iso: string): number {
  const [, month] = iso.split('-').map(Number)
  const year = Number(iso.slice(0, 4))
  return month >= 10 ? year + 1 : year
}

export function excelSerialToIso(serial: number): string {
  const utc = new Date(Date.UTC(1899, 11, 30))
  utc.setUTCDate(utc.getUTCDate() + serial)
  return toIsoDate(utc)
}

export function roundAf(value: number, digits = 6): number {
  const p = 10 ** digits
  return Math.round(value * p) / p
}
