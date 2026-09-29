import type {
  AccountDistrict,
  DistrictCode,
  PriorityUser,
  ReservoirCode,
} from './constants'

export type { AccountDistrict, DistrictCode, PriorityUser, ReservoirCode }

export interface CapacityPoint {
  elevation: number
  acreFeet: number
  surfaceAcres?: number
}

export interface CapacityTables {
  cranePrairie: CapacityPoint[]
  wickiup: CapacityPoint[]
  crescentLake: CapacityPoint[]
}

export interface DailyRawRow {
  date: string
  rockSpringsCfs: number
  snowCreekCfs: number
  cultusRiverCfs: number
  cultusCkCfs: number
  deerCkCfs: number
  quinnRiverCfs: number
  charltonCkCfs: number
  descBlwCraneCfs: number
  descBlwWickiupCfs: number
  crescentCkCfs: number
  descAtBenhamCfs: number
  arnoldCfs: number
  coidCanalCfs: number
  dcmidCfs: number
  nuidCfs: number
  northCanalCfs: number
  swalleyCfs: number
  lonePineNetCfs: number
  deboCfs: number
  nuidSpillCfs: number
  cranePrairieElev?: number | null
  cranePrairieContentsAf?: number | null
  wickiupElev?: number | null
  wickiupContentsAf?: number | null
  crescentElev?: number | null
  crescentContentsAf?: number | null
  wickiupEvapIn?: number | null
  missing?: string[]
}

export interface OpeningBalances {
  [district: string]: Partial<Record<ReservoirCode, number>>
}

export interface InstreamInputs {
  directAcres: Record<string, number>
  leasesCfs: Record<string, number>
  permanentCfs: Record<string, number>
}

export interface PumpMonth {
  month: number
  pumpedAf: number
  deliveriesAf: number
}

export interface ReportInputs {
  startDate: string
  endDate: string
  dateCode: number
  useLegacyCpInflow: boolean
  openingBalances: OpeningBalances
  daily: DailyRawRow[]
  instream: InstreamInputs
  maxRightCfsBySeason: Record<string, number[]>
  canalLoss: Record<string, number>
  pumps: { waterYear: number; months: PumpMonth[] }
  overrides: Record<string, number>
  capacity: CapacityTables
  crescentOctMinContentsAf?: number
}

export interface AllocationRow {
  user: PriorityUser
  maxRightAf: number
  divertedAf: number
  natUsedAf: number
  storageUsedAf: number
  remainingNfAf: number
  intoStorageAf: number
}

export interface NaturalFlowPage {
  days: number
  cranePrairieInflowAf: number
  cranePrairieNaturalLossAf: number
  naturalFlowToCpDamAf: number
  cranePrairieOutflowAf: number
  cranePrairieChangeInStorageAf: number
  cranePrairieLossChargeableAf: number
  cranePrairieNfReleasedAf: number
  cranePrairieStorageReleasedAf: number
  cranePrairieNfStoredAf: number
  wickiupChangeInStorageAf: number
  wickiupAvgSurfaceAcres: number
  wickiupEvapFeet: number
  wickiupEvapLossAf: number
  wickiupOutflowAf: number
  naturalFlowAboveWickiupAf: number
  totalNaturalFlowAtWickiupAf: number
  totalNfReleasedAf: number
  wickiupAndCpStorageReleasedAf: number
  crescentChangeInStorageAf: number
  crescentOutflowAf: number
  crescentNaturalFlowAf: number
  crescentStorageReleasedAf: number
  totalFlowAtBenhamAf: number
  wickCpStorageAtBfAf: number
  crescentStorageAtBfAf: number
  naturalFlowAtBenhamAf: number
  totalFlowAtBendAf: number
  percentReachingBend: number
  naturalFlowAtBendAf: number
  naturalFlowAtBendCfs: number
  totalStorageAtBendAf: number
  startingContents: Record<ReservoirCode, number>
  endingPhysicalContents: Record<ReservoirCode, number>
}

export interface UsageAtBend {
  arnoldAf: number
  coidCanalAf: number
  dcmidAf: number
  nuidMainAf: number
  nuidSpillAf: number
  nuidTotalAf: number
  northCanalAf: number
  lonePineNetAf: number
  lonePineAtRiverAf: number
  northCanalNetAf: number
  swalleyAf: number
  deboAf: number
  totalAtBendAf: number
}

export interface AllocationPage {
  usage: UsageAtBend
  riverIswrAf: number
  rows: AllocationRow[]
  totals: { divertedAf: number; natUsedAf: number; storageUsedAf: number }
}

export interface AccountRow {
  district: AccountDistrict
  priorAf: number
  storageUsedAf: number
  lossAf: number
  endingAf: number
}

export interface ReservoirAccounts {
  reservoir: ReservoirCode
  rows: AccountRow[]
  totals: { priorAf: number; storageUsedAf: number; lossAf: number; endingAf: number }
  physicalEndingAf: number
  accountingDiffAf: number
}

export interface PumpSummary {
  ytdPumpedAf: number
  ytdDeliveriesAf: number
  crookedRiverDemandAf: number
  deficitAf: number
}

export interface AccountsPage {
  cranePrairie: ReservoirAccounts
  wickiup: ReservoirAccounts
  crescent: ReservoirAccounts
  pumps: PumpSummary
  reconciled: boolean
}

export interface ReportResult {
  page1: NaturalFlowPage
  page2: AllocationPage
  page3: AccountsPage
  dataQuality: 'PROVISIONAL' | 'CORRECTED'
}
