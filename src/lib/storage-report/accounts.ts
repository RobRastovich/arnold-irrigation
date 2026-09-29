import {
  ACCOUNT_DISTRICTS,
  CRESCENT_TO_BENO_FACTOR,
  CROOKED_RIVER_FRACTION,
  RECONCILE_TOLERANCE_AF,
  WICKIUP_TO_BENO_FACTOR,
  type AccountDistrict,
  type ReservoirCode,
} from './constants'
import { allocationByUser } from './allocate'
import type {
  AccountRow,
  AccountsPage,
  AllocationPage,
  NaturalFlowPage,
  PumpMonth,
  ReportInputs,
  ReservoirAccounts,
} from './types'

function override(inputs: ReportInputs, key: string): number | undefined {
  if (Object.prototype.hasOwnProperty.call(inputs.overrides, key)) {
    return inputs.overrides[key]
  }
  return undefined
}

function prior(inputs: ReportInputs, district: AccountDistrict, reservoir: ReservoirCode): number {
  return inputs.openingBalances[district]?.[reservoir] ?? 0
}

function pumpLookup(months: PumpMonth[], endMonth: number): { ytdPumpedAf: number; ytdDeliveriesAf: number } {
  const sorted = [...months].sort((a, b) => a.month - b.month)
  let ytdPumpedAf = 0
  let ytdDeliveriesAf = 0
  for (const month of sorted) {
    if (month.month > endMonth) break
    ytdPumpedAf += month.pumpedAf
    ytdDeliveriesAf += month.deliveriesAf
  }
  return { ytdPumpedAf, ytdDeliveriesAf }
}

function buildReservoir(
  reservoir: ReservoirCode,
  rows: AccountRow[],
  physicalEndingAf: number
): ReservoirAccounts {
  const totals = rows.reduce(
    (acc, row) => {
      acc.priorAf += row.priorAf
      acc.storageUsedAf += row.storageUsedAf
      acc.lossAf += row.lossAf
      acc.endingAf += row.endingAf
      return acc
    },
    { priorAf: 0, storageUsedAf: 0, lossAf: 0, endingAf: 0 }
  )
  return {
    reservoir,
    rows,
    totals,
    physicalEndingAf,
    accountingDiffAf: physicalEndingAf - totals.endingAf,
  }
}

export function computeAccounts(
  inputs: ReportInputs,
  page1: NaturalFlowPage,
  page2: AllocationPage
): AccountsPage {
  const pctBend = page2.usage.totalAtBendAf && page1.totalFlowAtBenhamAf
    ? page1.percentReachingBend
    : page1.percentReachingBend

  const lp = allocationByUser(page2, 'LONE_PINE')
  const arnold = allocationByUser(page2, 'ARNOLD')
  const coid1900 = allocationByUser(page2, 'COID_1900')
  const dcmid1905 = allocationByUser(page2, 'DCMID_1905')
  const dcmid1911 = allocationByUser(page2, 'DCMID_1911')
  const nuid = allocationByUser(page2, 'NORTH_UNIT')
  const crescent1961 = allocationByUser(page2, 'CRESCENT_1961')

  const toReservoir = (storageAtBend: number, factor: number) =>
    pctBend === 0 ? 0 : storageAtBend / pctBend / factor

  // Crane Prairie: post-1938 zeros for AID/LP/COID; NUID used AF is a yellow-cell override.
  const cpUsed: Record<AccountDistrict, number> = {
    LONE_PINE: override(inputs, 'cranePrairie.LONE_PINE.storageUsedAf') ?? 0,
    ARNOLD: override(inputs, 'cranePrairie.ARNOLD.storageUsedAf') ?? 0,
    COID: override(inputs, 'cranePrairie.COID.storageUsedAf') ?? 0,
    NUID: override(inputs, 'cranePrairie.NUID.storageUsedAf') ?? 0,
    TUMALO: override(inputs, 'cranePrairie.TUMALO.storageUsedAf') ?? 0,
    OSF: override(inputs, 'cranePrairie.OSF.storageUsedAf') ?? 0,
  }
  const cpStart = page1.startingContents.CRANE_PRAIRIE || 1
  const cpRows: AccountRow[] = ACCOUNT_DISTRICTS.map((district) => {
    const priorAf = prior(inputs, district, 'CRANE_PRAIRIE')
    const storageUsedAf = cpUsed[district]
    const lossAf = (page1.cranePrairieLossChargeableAf * priorAf) / cpStart
    return { district, priorAf, storageUsedAf, lossAf, endingAf: priorAf - storageUsedAf - lossAf }
  })
  const cranePrairie = buildReservoir('CRANE_PRAIRIE', cpRows, page1.endingPhysicalContents.CRANE_PRAIRIE)

  const osfCharge = override(inputs, 'wickiup.NUID.osfChargeAf') ?? 50
  const wickUsed: Record<AccountDistrict, number> = {
    LONE_PINE: override(inputs, 'wickiup.LONE_PINE.storageUsedAf') ?? toReservoir(lp?.storageUsedAf ?? 0, WICKIUP_TO_BENO_FACTOR),
    ARNOLD: override(inputs, 'wickiup.ARNOLD.storageUsedAf') ?? toReservoir(arnold?.storageUsedAf ?? 0, WICKIUP_TO_BENO_FACTOR),
    COID: override(inputs, 'wickiup.COID.storageUsedAf') ?? toReservoir(coid1900?.storageUsedAf ?? 0, WICKIUP_TO_BENO_FACTOR),
    NUID:
      override(inputs, 'wickiup.NUID.storageUsedAf')
      ?? (toReservoir(nuid?.storageUsedAf ?? 0, WICKIUP_TO_BENO_FACTOR) - cpUsed.NUID - osfCharge),
    TUMALO: override(inputs, 'wickiup.TUMALO.storageUsedAf') ?? 0,
    OSF: override(inputs, 'wickiup.OSF.storageUsedAf') ?? 0,
  }
  const wickStart = page1.startingContents.WICKIUP || 1
  const wickRows: AccountRow[] = ACCOUNT_DISTRICTS.map((district) => {
    const priorAf = prior(inputs, district, 'WICKIUP')
    const storageUsedAf = wickUsed[district]
    const lossAf = priorAf <= 0 ? 0 : (page1.wickiupEvapLossAf * priorAf) / wickStart
    return { district, priorAf, storageUsedAf, lossAf, endingAf: priorAf - storageUsedAf - lossAf }
  })
  const wickiup = buildReservoir('WICKIUP', wickRows, page1.endingPhysicalContents.WICKIUP)

  const crescentFilling = page1.crescentChangeInStorageAf > page1.crescentOutflowAf
  const crescentLossPool = crescentFilling
    ? page1.crescentChangeInStorageAf - page1.crescentOutflowAf
    : 0
  const crescentStart = page1.startingContents.CRESCENT_LAKE || 1
  const dcmidCrescentDefault =
    ((dcmid1905?.storageUsedAf ?? 0) + (dcmid1911?.storageUsedAf ?? 0) + (crescent1961?.storageUsedAf ?? 0))
      / (pctBend || 1)
      / CRESCENT_TO_BENO_FACTOR
    - wickUsed.TUMALO * WICKIUP_TO_BENO_FACTOR / CRESCENT_TO_BENO_FACTOR

  const cresUsed: Record<AccountDistrict, number> = {
    LONE_PINE: override(inputs, 'crescent.LONE_PINE.storageUsedAf') ?? 0,
    ARNOLD: override(inputs, 'crescent.ARNOLD.storageUsedAf') ?? 0,
    COID: override(inputs, 'crescent.COID.storageUsedAf') ?? 0,
    NUID: override(inputs, 'crescent.NUID.storageUsedAf') ?? 0,
    TUMALO: override(inputs, 'crescent.TUMALO.storageUsedAf') ?? dcmidCrescentDefault,
    OSF: override(inputs, 'crescent.OSF.storageUsedAf') ?? 0,
  }
  const cresRows: AccountRow[] = ACCOUNT_DISTRICTS.map((district) => {
    const priorAf = prior(inputs, district, 'CRESCENT_LAKE')
    const storageUsedAf = cresUsed[district]
    const lossAf = crescentFilling ? (crescentLossPool * priorAf) / crescentStart : 0
    return { district, priorAf, storageUsedAf, lossAf, endingAf: priorAf - storageUsedAf - lossAf }
  })
  const crescent = buildReservoir('CRESCENT_LAKE', cresRows, page1.endingPhysicalContents.CRESCENT_LAKE)

  const endMonth = Number(inputs.endDate.slice(5, 7))
  const { ytdPumpedAf, ytdDeliveriesAf } = pumpLookup(inputs.pumps.months, endMonth)
  const crookedRiverDemandAf = CROOKED_RIVER_FRACTION * ytdDeliveriesAf
  const pumps = {
    ytdPumpedAf,
    ytdDeliveriesAf,
    crookedRiverDemandAf,
    deficitAf: crookedRiverDemandAf - ytdPumpedAf,
  }

  const maxAbsDiff = Math.max(
    Math.abs(cranePrairie.accountingDiffAf),
    Math.abs(wickiup.accountingDiffAf),
    Math.abs(crescent.accountingDiffAf)
  )

  return {
    cranePrairie,
    wickiup,
    crescent,
    pumps,
    reconciled: maxAbsDiff <= RECONCILE_TOLERANCE_AF,
  }
}
