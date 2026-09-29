import {
  CFS_TO_AF,
  CRESCENT_1911_GATE_AF,
  CRESCENT_TO_BENO_FACTOR,
  DEFAULT_CANAL_LOSS,
  DUFFY_CFS_PER_ACRE,
  LONE_PINE_CHANNEL_FACTOR,
  PRIORITY_USERS,
  type PriorityUser,
} from './constants'
import { seasonIndexForDateCode } from './decreeSeason'
import type {
  AllocationPage,
  AllocationRow,
  InstreamInputs,
  NaturalFlowPage,
  ReportInputs,
  UsageAtBend,
} from './types'
import { cfsDaysToAf } from './units'

function sumCfs(daily: ReportInputs['daily'], key: keyof ReportInputs['daily'][number]): number {
  return daily.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
}

export function computeRiverIswrAf(instream: InstreamInputs, dateCode: number, days: number): number {
  const season = seasonIndexForDateCode(dateCode)
  const swalleyDirectCfs =
    (DUFFY_CFS_PER_ACRE.SWALLEY[season] ?? 0)
    * (1 - (DEFAULT_CANAL_LOSS.SWALLEY ?? 0))
    * (instream.directAcres.SWALLEY ?? 0)
  const coidDirectCfs =
    (DUFFY_CFS_PER_ACRE.COID_1900[season] ?? 0)
    * (1 - (DEFAULT_CANAL_LOSS.COID_1900 ?? 0))
    * (instream.directAcres.COID_1900 ?? 0)

  const directsAf = cfsDaysToAf((swalleyDirectCfs + coidDirectCfs) * days)
  const leaseCfs = Object.values(instream.leasesCfs).reduce((s, v) => s + (v ?? 0), 0)
  const permCfs = Object.values(instream.permanentCfs).reduce((s, v) => s + (v ?? 0), 0)
  return directsAf + cfsDaysToAf(leaseCfs * days) + cfsDaysToAf(permCfs * days)
}

/** Max-right table minus leases inflated by canal loss (water_rights FinalWR_Table). */
export function finalMaxRightCfs(
  rightName: string,
  dateCode: number,
  maxRightCfsBySeason: Record<string, number[]>,
  instream: InstreamInputs,
  canalLoss: Record<string, number>
): number {
  const season = seasonIndexForDateCode(dateCode)
  const table = maxRightCfsBySeason[rightName] ?? [0, 0, 0, 0, 0]
  const base = table[season] ?? 0
  const leaseKey =
    rightName === 'NORTH_UNIT' ? 'NORTH_UNIT'
    : rightName === 'COID_1900' ? 'COID_1900'
    : rightName === 'COID_1907' ? 'COID_1907'
    : rightName === 'SWALLEY' ? 'SWALLEY'
    : rightName === 'ARNOLD' ? 'ARNOLD'
    : rightName === 'LONE_PINE' ? 'LONE_PINE'
    : ''
  if (rightName === 'DCMID_1905' || rightName === 'DCMID_1911' || rightName === 'CRESCENT_1961') {
    return base
  }
  const leases = leaseKey ? (instream.leasesCfs[leaseKey] ?? 0) : 0
  const lossKey =
    rightName === 'NORTH_UNIT' ? 'NORTH_UNIT'
    : rightName === 'SWALLEY' ? 'SWALLEY'
    : rightName === 'ARNOLD' ? 'ARNOLD'
    : rightName === 'LONE_PINE' ? 'LONE_PINE'
    : 'COID_1900'
  const loss = canalLoss[lossKey] ?? DEFAULT_CANAL_LOSS[lossKey] ?? 0
  const denom = 1 - loss
  return denom === 0 ? base : base - leases / denom
}

function takeNatural(remaining: number, maxRight: number, diverted: number): number {
  return Math.min(remaining, maxRight, diverted)
}

export function computeAllocation(inputs: ReportInputs, page1: NaturalFlowPage): AllocationPage {
  const days = page1.days
  const daily = inputs.daily
  const usage: UsageAtBend = {
    arnoldAf: cfsDaysToAf(sumCfs(daily, 'arnoldCfs')),
    coidCanalAf: cfsDaysToAf(sumCfs(daily, 'coidCanalCfs')),
    dcmidAf: cfsDaysToAf(sumCfs(daily, 'dcmidCfs')),
    nuidMainAf: cfsDaysToAf(sumCfs(daily, 'nuidCfs')),
    nuidSpillAf: cfsDaysToAf(sumCfs(daily, 'nuidSpillCfs')),
    nuidTotalAf: 0,
    northCanalAf: cfsDaysToAf(sumCfs(daily, 'northCanalCfs')),
    lonePineNetAf: cfsDaysToAf(sumCfs(daily, 'lonePineNetCfs')),
    lonePineAtRiverAf: 0,
    northCanalNetAf: 0,
    swalleyAf: cfsDaysToAf(sumCfs(daily, 'swalleyCfs')),
    deboAf: cfsDaysToAf(sumCfs(daily, 'deboCfs')),
    totalAtBendAf: page1.totalFlowAtBendAf,
  }
  usage.nuidTotalAf = usage.nuidMainAf + usage.nuidSpillAf
  usage.lonePineAtRiverAf = usage.lonePineNetAf / LONE_PINE_CHANNEL_FACTOR
  usage.northCanalNetAf = usage.northCanalAf - usage.lonePineAtRiverAf - usage.nuidSpillAf

  const riverIswrAf = computeRiverIswrAf(inputs.instream, inputs.dateCode, days)
  const maxAf = (name: string) =>
    finalMaxRightCfs(name, inputs.dateCode, inputs.maxRightCfsBySeason, inputs.instream, inputs.canalLoss)
    * days
    * CFS_TO_AF

  const crescentStoredSinceOct =
    page1.endingPhysicalContents.CRESCENT_LAKE - (inputs.crescentOctMinContentsAf ?? 0)
  const crescentNfCfs =
    days * CFS_TO_AF === 0
      ? 0
      : (page1.crescentNaturalFlowAf * CRESCENT_TO_BENO_FACTOR * page1.percentReachingBend) / (days * CFS_TO_AF)
  const storageOnlyRightAf =
    crescentStoredSinceOct < CRESCENT_1911_GATE_AF ? crescentNfCfs * days * CFS_TO_AF : 0

  const rows: AllocationRow[] = []
  let remaining = page1.naturalFlowAtBendAf

  const push = (
    user: PriorityUser,
    maxRightAf: number,
    divertedAf: number,
    opts?: { storageOnly?: boolean; useAllRemaining?: boolean }
  ) => {
    let natUsedAf: number
    let intoStorageAf = 0
    let storageUsedAf = 0
    if (opts?.storageOnly) {
      natUsedAf = Math.min(remaining, maxRightAf)
      intoStorageAf = natUsedAf
      storageUsedAf = -natUsedAf
    } else if (opts?.useAllRemaining) {
      natUsedAf = divertedAf
      storageUsedAf = -natUsedAf
      intoStorageAf = natUsedAf
    } else {
      natUsedAf = takeNatural(remaining, maxRightAf, divertedAf)
      storageUsedAf = divertedAf - natUsedAf
    }
    remaining -= natUsedAf
    rows.push({
      user,
      maxRightAf,
      divertedAf,
      natUsedAf,
      storageUsedAf,
      remainingNfAf: remaining,
      intoStorageAf,
    })
  }

  push('RIVER_ISWR', riverIswrAf, usage.deboAf)
  // River row uses all DEBO as natural (workbook E35 = D35), even if above max right.
  rows[0].natUsedAf = usage.deboAf
  rows[0].storageUsedAf = 0
  remaining = page1.naturalFlowAtBendAf - usage.deboAf
  rows[0].remainingNfAf = remaining

  push('SWALLEY', maxAf('SWALLEY'), usage.swalleyAf)
  const coid1900 = rows.length
  push('COID_1900', maxAf('COID_1900'), usage.coidCanalAf + usage.northCanalNetAf)
  push('LONE_PINE', maxAf('LONE_PINE'), usage.lonePineAtRiverAf)
  push('ARNOLD', maxAf('ARNOLD'), usage.arnoldAf)
  push('DCMID_1905', maxAf('DCMID_1905'), usage.dcmidAf)

  const coid1900Row = rows[coid1900]
  const coid1907Diverted = Math.max(coid1900Row.divertedAf - coid1900Row.natUsedAf, 0)
  push('COID_1907', maxAf('COID_1907'), coid1907Diverted)
  push('DCMID_1911', storageOnlyRightAf, 0, { storageOnly: true })
  push('NORTH_UNIT', maxAf('NORTH_UNIT'), usage.nuidTotalAf)
  push('CRESCENT_1961', storageOnlyRightAf, remaining, { useAllRemaining: true })

  const totals = rows.reduce(
    (acc, row) => {
      if (row.user === 'RIVER_ISWR') {
        acc.divertedAf += row.divertedAf
        acc.natUsedAf += row.natUsedAf
        return acc
      }
      acc.divertedAf += row.divertedAf
      acc.natUsedAf += row.natUsedAf
      acc.storageUsedAf += row.storageUsedAf
      return acc
    },
    { divertedAf: 0, natUsedAf: 0, storageUsedAf: 0 }
  )

  void PRIORITY_USERS
  return { usage, riverIswrAf, rows, totals }
}

export function allocationByUser(page: AllocationPage, user: PriorityUser): AllocationRow | undefined {
  return page.rows.find((row) => row.user === user)
}
