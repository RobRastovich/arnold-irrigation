import {
  CFS_TO_AF,
  CP_NATURAL_LOSS_CFS,
  CRESCENT_TO_BENO_FACTOR,
  WICKIUP_PAN_FACTOR,
  WICKIUP_TO_BENO_FACTOR,
} from './constants'
import { averageSurfaceAcres } from './capacity'
import type { DailyRawRow, NaturalFlowPage, ReportInputs } from './types'
import { afToAvgCfs, cfsDaysToAf, daysInPeriod } from './units'

function sumCfs(daily: DailyRawRow[], key: keyof DailyRawRow): number {
  return daily.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
}

function lastDefined(daily: DailyRawRow[], key: keyof DailyRawRow): number {
  for (let i = daily.length - 1; i >= 0; i--) {
    const value = daily[i][key]
    if (value != null && value !== '') return Number(value)
  }
  return 0
}

function sumOpening(inputs: ReportInputs, reservoir: 'CRANE_PRAIRIE' | 'WICKIUP' | 'CRESCENT_LAKE'): number {
  return Object.values(inputs.openingBalances).reduce(
    (sum, row) => sum + (row[reservoir] ?? 0),
    0
  )
}

export function computeNaturalFlow(inputs: ReportInputs): NaturalFlowPage {
  const days = daysInPeriod(inputs.startDate, inputs.endDate)
  const daily = inputs.daily

  const tributaryInflowCfs = sumCfs(daily, 'rockSpringsCfs')
    + sumCfs(daily, 'snowCreekCfs')
    + sumCfs(daily, 'cultusRiverCfs')
    + sumCfs(daily, 'cultusCkCfs')
    + sumCfs(daily, 'deerCkCfs')
    + sumCfs(daily, 'quinnRiverCfs')
    + sumCfs(daily, 'charltonCkCfs')

  const cranePrairieInflowAf = inputs.useLegacyCpInflow
    ? cfsDaysToAf(tributaryInflowCfs)
    : cfsDaysToAf(sumCfs(daily, 'descBlwCraneCfs'))

  const cranePrairieNaturalLossAf = days * CP_NATURAL_LOSS_CFS * CFS_TO_AF
  const naturalFlowToCpDamAf = cranePrairieInflowAf - cranePrairieNaturalLossAf
  const cranePrairieOutflowAf = cfsDaysToAf(sumCfs(daily, 'descBlwCraneCfs'))

  const startingContents = {
    CRANE_PRAIRIE: sumOpening(inputs, 'CRANE_PRAIRIE'),
    WICKIUP: sumOpening(inputs, 'WICKIUP'),
    CRESCENT_LAKE: sumOpening(inputs, 'CRESCENT_LAKE'),
  }
  const endingPhysicalContents = {
    CRANE_PRAIRIE: lastDefined(daily, 'cranePrairieContentsAf'),
    WICKIUP: lastDefined(daily, 'wickiupContentsAf'),
    CRESCENT_LAKE: lastDefined(daily, 'crescentContentsAf'),
  }

  const cranePrairieChangeInStorageAf = startingContents.CRANE_PRAIRIE - endingPhysicalContents.CRANE_PRAIRIE
  const cranePrairieNfReleasedAf = Math.min(naturalFlowToCpDamAf, cranePrairieOutflowAf)
  const cranePrairieStorageReleasedAf = cranePrairieOutflowAf - cranePrairieNfReleasedAf
  const cranePrairieNfStoredAf = Math.max(naturalFlowToCpDamAf - cranePrairieOutflowAf, 0)
  const cranePrairieLossChargeableAf =
    cranePrairieChangeInStorageAf + naturalFlowToCpDamAf - cranePrairieOutflowAf

  const wickiupChangeInStorageAf = startingContents.WICKIUP - endingPhysicalContents.WICKIUP
  const wickiupAvgSurfaceAcres = averageSurfaceAcres(
    startingContents.WICKIUP,
    endingPhysicalContents.WICKIUP,
    inputs.capacity.wickiup
  )
  const wickiupEvapInches = daily.reduce((sum, row) => sum + (row.wickiupEvapIn ?? 0), 0)
  const wickiupEvapFeet = wickiupEvapInches / 12
  const wickiupEvapLossAf = wickiupAvgSurfaceAcres * wickiupEvapFeet * WICKIUP_PAN_FACTOR
  const wickiupOutflowAf = cfsDaysToAf(sumCfs(daily, 'descBlwWickiupCfs'))
  const naturalFlowAboveWickiupAf =
    wickiupOutflowAf - wickiupChangeInStorageAf + wickiupEvapLossAf - cranePrairieOutflowAf
  const totalNaturalFlowAtWickiupAf = naturalFlowAboveWickiupAf + naturalFlowToCpDamAf
  const totalNfReleasedAf = Math.min(totalNaturalFlowAtWickiupAf, wickiupOutflowAf)
  const wickiupAndCpStorageReleasedAf = wickiupOutflowAf - totalNaturalFlowAtWickiupAf

  const crescentChangeInStorageAf = startingContents.CRESCENT_LAKE - endingPhysicalContents.CRESCENT_LAKE
  const crescentOutflowAf = cfsDaysToAf(sumCfs(daily, 'crescentCkCfs'))
  const crescentNaturalFlowAf = Math.max(crescentOutflowAf - crescentChangeInStorageAf, 0)
  const crescentStorageReleasedAf = crescentOutflowAf - crescentNaturalFlowAf

  const totalFlowAtBenhamAf = cfsDaysToAf(sumCfs(daily, 'descAtBenhamCfs'))
  const wickCpStorageAtBfAf = wickiupAndCpStorageReleasedAf * WICKIUP_TO_BENO_FACTOR
  const crescentStorageAtBfAf = crescentStorageReleasedAf * CRESCENT_TO_BENO_FACTOR
  const naturalFlowAtBenhamAf = totalFlowAtBenhamAf - wickCpStorageAtBfAf - crescentStorageAtBfAf

  const totalFlowAtBendAf =
    cfsDaysToAf(sumCfs(daily, 'arnoldCfs'))
    + cfsDaysToAf(sumCfs(daily, 'coidCanalCfs'))
    + cfsDaysToAf(sumCfs(daily, 'dcmidCfs'))
    + cfsDaysToAf(sumCfs(daily, 'nuidCfs'))
    + cfsDaysToAf(sumCfs(daily, 'northCanalCfs'))
    + cfsDaysToAf(sumCfs(daily, 'swalleyCfs'))
    + cfsDaysToAf(sumCfs(daily, 'deboCfs'))

  const percentReachingBend = totalFlowAtBenhamAf === 0 ? 0 : totalFlowAtBendAf / totalFlowAtBenhamAf
  const naturalFlowAtBendAf = percentReachingBend * naturalFlowAtBenhamAf
  const totalStorageAtBendAf = percentReachingBend * (wickCpStorageAtBfAf + crescentStorageAtBfAf)

  return {
    days,
    cranePrairieInflowAf,
    cranePrairieNaturalLossAf,
    naturalFlowToCpDamAf,
    cranePrairieOutflowAf,
    cranePrairieChangeInStorageAf,
    cranePrairieLossChargeableAf,
    cranePrairieNfReleasedAf,
    cranePrairieStorageReleasedAf,
    cranePrairieNfStoredAf,
    wickiupChangeInStorageAf,
    wickiupAvgSurfaceAcres,
    wickiupEvapFeet,
    wickiupEvapLossAf,
    wickiupOutflowAf,
    naturalFlowAboveWickiupAf,
    totalNaturalFlowAtWickiupAf,
    totalNfReleasedAf,
    wickiupAndCpStorageReleasedAf,
    crescentChangeInStorageAf,
    crescentOutflowAf,
    crescentNaturalFlowAf,
    crescentStorageReleasedAf,
    totalFlowAtBenhamAf,
    wickCpStorageAtBfAf,
    crescentStorageAtBfAf,
    naturalFlowAtBenhamAf,
    totalFlowAtBendAf,
    percentReachingBend,
    naturalFlowAtBendAf,
    naturalFlowAtBendCfs: afToAvgCfs(naturalFlowAtBendAf, days),
    totalStorageAtBendAf,
    startingContents,
    endingPhysicalContents,
  }
}
