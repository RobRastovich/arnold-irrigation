/** Shared constants so the engine and UI cannot drift from the OWRD workbook. */

export const CFS_TO_AF = 1.983471
export const WICKIUP_TO_BENO_FACTOR = 0.875 // 12.5% channel-loss charge
export const CRESCENT_TO_BENO_FACTOR = 0.82 // 18% channel-loss charge
export const CROOKED_RIVER_FRACTION = 0.0768
export const CP_NATURAL_LOSS_CFS = 10
export const LONE_PINE_CHANNEL_FACTOR = 0.75 // 25% channel-loss charge on page 2
export const ROCK_SPRINGS_DEFAULT_CFS = 16
export const CRESCENT_1911_GATE_AF = 35000
export const WICKIUP_PAN_FACTOR = 1
export const PUMP_SEASON_END_DAY = 44500 // Excel serial for "end pump season" (Oct 31 convention in workbook)
export const RECONCILE_TOLERANCE_AF = 1

export const DISTRICTS = [
  'NUID',
  'COID',
  'LONE_PINE',
  'ARNOLD',
  'TUMALO',
  'SWALLEY',
  'OSF',
] as const

export type DistrictCode = (typeof DISTRICTS)[number]

export const ACCOUNT_DISTRICTS = [
  'LONE_PINE',
  'ARNOLD',
  'COID',
  'NUID',
  'TUMALO',
  'OSF',
] as const

export type AccountDistrict = (typeof ACCOUNT_DISTRICTS)[number]

export const RESERVOIRS = ['CRANE_PRAIRIE', 'WICKIUP', 'CRESCENT_LAKE'] as const
export type ReservoirCode = (typeof RESERVOIRS)[number]

export const DISTRICT_LABELS: Record<DistrictCode, string> = {
  NUID: 'North Unit',
  COID: 'Central Oregon',
  LONE_PINE: 'Lone Pine',
  ARNOLD: 'Arnold',
  TUMALO: 'Tumalo (DCMID)',
  SWALLEY: 'Swalley',
  OSF: 'OSF',
}

export const RESERVOIR_LABELS: Record<ReservoirCode, string> = {
  CRANE_PRAIRIE: 'Crane Prairie',
  WICKIUP: 'Wickiup',
  CRESCENT_LAKE: 'Crescent Lake',
}

/** Duffy decree date codes: 1 Apr 1–30 & Oct 1–31; 2 May 1–14 & Sep 15–30; 3 May 15–Sep 14 */
export const DECREE_SEASON_LABELS: Record<number, string> = {
  1: 'Apr 1–30 & Oct 1–31',
  2: 'May 1–14 & Sep 15–30',
  3: 'May 15–Sep 14',
}

/** Column index in the 5-period max-right table for a Duffy date code (1-based season → 0-based array). */
export const DATE_CODE_TO_SEASON_INDEX: Record<number, number> = {
  1: 0, // Apr 1 – May 1 / Oct 1 – Nov 1
  2: 1, // May 1 – May 15 / Sep 15 – Oct 1
  3: 2, // May 15 – Sep 15
}

export const PRIORITY_USERS = [
  'RIVER_ISWR',
  'SWALLEY',
  'COID_1900',
  'LONE_PINE',
  'ARNOLD',
  'DCMID_1905',
  'COID_1907',
  'DCMID_1911',
  'NORTH_UNIT',
  'CRESCENT_1961',
] as const

export type PriorityUser = (typeof PRIORITY_USERS)[number]

export const PRIORITY_LABELS: Record<PriorityUser, string> = {
  RIVER_ISWR: 'River (ISWR + directs)',
  SWALLEY: 'Swalley',
  COID_1900: 'COID (1900)',
  LONE_PINE: 'Lone Pine',
  ARNOLD: 'Arnold',
  DCMID_1905: 'DCMID (1905)',
  COID_1907: 'COID (1907)',
  DCMID_1911: 'DCMID (1911)',
  NORTH_UNIT: 'North Unit',
  CRESCENT_1961: 'Crescent (1961)',
}

/** Duffy cfs-per-acre by right, five seasons (Apr, early May, summer, late Sep, Oct). */
export const DUFFY_CFS_PER_ACRE: Record<string, number[]> = {
  ARNOLD: [1 / 51, 1 / 39, 1 / 20.8, 1 / 39, 1 / 51],
  COID_1900: [1 / 80, 1 / 60, 1 / 32.4, 1 / 60, 1 / 80],
  COID_1907: [1 / 80, 1 / 60, 1 / 32.4, 1 / 60, 1 / 80],
  DCMID: [1 / 80, 1 / 60, 1 / 32.4, 1 / 60, 1 / 80],
  SWALLEY: [1 / 83, 1 / 62, 1 / 33.45, 1 / 62, 1 / 83],
  LONE_PINE: [1 / 137, 1 / 109, 1 / 86.6, 1 / 109, 1 / 137],
  NORTH_UNIT: [0, 0, 0, 0, 0],
}

export const DEFAULT_CANAL_LOSS: Record<string, number> = {
  ARNOLD: 0.65,
  COID_1900: 0.45,
  COID_1907: 0.45,
  DCMID: 0.45,
  SWALLEY: 0.43,
  LONE_PINE: 0.35,
  NORTH_UNIT: 0,
}

export const AGREEMENT_DISCLAIMER =
  'Accounting follows the 2020 inter-district agreement for AID / Lone Pine / COID use of Wickiup. Water-right title is unchanged. AID, Lone Pine, and COID “accounts” in Wickiup are bookkeeping, not a storage right.'
