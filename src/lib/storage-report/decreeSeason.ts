import { DATE_CODE_TO_SEASON_INDEX } from './constants'
import { parseIsoDate } from './units'

/**
 * Duffy date code used on water_rights!D30:
 * 1 = Apr 1–30 and Oct 1–31
 * 2 = May 1–14 and Sep 15–30
 * 3 = May 15–Sep 14
 */
export function decreeDateCode(isoDate: string): 1 | 2 | 3 {
  const date = parseIsoDate(isoDate)
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()

  if (month === 4 || month === 10) return 1
  if (month === 5 && day <= 14) return 2
  if (month === 9 && day >= 15) return 2
  if ((month === 5 && day >= 15) || month === 6 || month === 7 || month === 8 || (month === 9 && day <= 14)) {
    return 3
  }
  return 1
}

export function seasonIndexForDateCode(dateCode: number): number {
  return DATE_CODE_TO_SEASON_INDEX[dateCode] ?? 2
}

/** Dominant date code for a period (workbook uses a single code for the whole run). */
export function periodDateCode(startDate: string, endDate: string): 1 | 2 | 3 {
  return decreeDateCode(startDate)
}
