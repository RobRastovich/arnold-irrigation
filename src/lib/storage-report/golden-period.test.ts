import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { contentsFromStage, surfaceAcresFromContents } from './capacity'
import { decreeDateCode } from './decreeSeason'
import { runReport } from './runReport'
import { cfsDaysToAf, excelSerialToIso, waterYearForDate } from './units'
import { CFS_TO_AF } from './constants'
import type { CapacityTables, ReportInputs } from './types'

const fixturesDir = path.join(__dirname, 'fixtures')
const golden = JSON.parse(readFileSync(path.join(fixturesDir, 'golden-period-2026-08.json'), 'utf8'))
const capacity = JSON.parse(readFileSync(path.join(fixturesDir, 'capacity-tables.json'), 'utf8')) as CapacityTables

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected}, got ${actual} (Δ ${actual - expected})`
  )
}

describe('units', () => {
  it('converts CFS-days with the workbook constant', () => {
    close(cfsDaysToAf(1), CFS_TO_AF, 1e-12, '1 cfs-day')
    close(cfsDaysToAf(147), 291.570237, 1e-6, 'Arnold 147 cfs-days')
  })

  it('maps the golden Excel serials to Aug 15–31 2026', () => {
    assert.equal(excelSerialToIso(46249), '2026-08-15')
    assert.equal(excelSerialToIso(46265), '2026-08-31')
    assert.equal(waterYearForDate('2026-08-15'), 2026)
    assert.equal(waterYearForDate('2025-10-01'), 2026)
  })
})

describe('decreeSeason', () => {
  it('uses Duffy date codes', () => {
    assert.equal(decreeDateCode('2026-04-15'), 1)
    assert.equal(decreeDateCode('2026-05-10'), 2)
    assert.equal(decreeDateCode('2026-08-20'), 3)
    assert.equal(decreeDateCode('2026-09-20'), 2)
    assert.equal(decreeDateCode('2026-10-15'), 1)
  })
})

describe('capacity', () => {
  it('interpolates Crane Prairie stage on the 0.1-foot table', () => {
    const table = capacity.cranePrairie
    const exact = table.find((p) => p.elevation === 4441.0)
    assert.ok(exact)
    close(contentsFromStage(4441.0, table), exact!.acreFeet, 1, 'exact 4441.0')
    const lo = contentsFromStage(4441.0, table)
    const hi = contentsFromStage(4441.1, table)
    const mid = contentsFromStage(4441.05, table)
    close(mid, (lo + hi) / 2, 1, '0.05 ft interpolate')
  })

  it('looks up Wickiup surface acres from contents', () => {
    const acres = surfaceAcresFromContents(56014, capacity.wickiup)
    assert.ok(acres > 2000 && acres < 4000, `acres ${acres}`)
  })
})

describe('golden workbook period Aug 15–31 2026', () => {
  const inputs: ReportInputs = {
    startDate: golden.period.startDate,
    endDate: golden.period.endDate,
    dateCode: golden.period.dateCode,
    useLegacyCpInflow: true,
    openingBalances: golden.openingBalances,
    daily: golden.daily,
    instream: golden.instream,
    maxRightCfsBySeason: golden.maxRightCfsBySeason,
    canalLoss: golden.canalLoss,
    pumps: golden.pumps,
    overrides: golden.overrides,
    capacity,
    crescentOctMinContentsAf: 5652.54,
  }

  const result = runReport(inputs, 'CORRECTED')
  const arnold = result.page2.rows.find((r) => r.user === 'ARNOLD')!

  it('matches page 1 natural flow at Bend', () => {
    close(result.page1.naturalFlowAtBendAf, golden.expected.naturalFlowAtBendAf, 1, 'NF at Bend AF')
    close(result.page1.percentReachingBend, golden.expected.percentReachingBend, 0.001, '% reaching Bend')
    close(result.page1.totalFlowAtBenhamAf, golden.expected.totalFlowAtBenhamAf, 1, 'flow at Benham')
    close(result.page1.totalFlowAtBendAf, golden.expected.totalFlowAtBendAf, 1, 'flow at Bend')
  })

  it('matches Arnold diversion and storage used', () => {
    close(arnold.divertedAf, golden.expected.arnoldDivertedAf, 0.05, 'Arnold diverted')
    close(arnold.storageUsedAf, golden.expected.arnoldStorageUsedAf, 0.05, 'Arnold storage used')
    close(arnold.natUsedAf, golden.expected.arnoldNatUsedAf, 0.05, 'Arnold NF used')
  })

  it('reconciles reservoirs within 1 AF', () => {
    close(result.page3.cranePrairie.accountingDiffAf, golden.expected.cranePrairieAccountingDiffAf, 1, 'CP diff')
    close(result.page3.wickiup.accountingDiffAf, golden.expected.wickiupAccountingDiffAf, 1, 'Wickiup diff')
    close(result.page3.crescent.accountingDiffAf, golden.expected.crescentAccountingDiffAf, 1, 'Crescent diff')
    assert.equal(result.page3.reconciled, true)
  })

  it('computes Crooked River demand as 0.0768 × NUID YTD deliveries', () => {
    close(result.page3.pumps.ytdDeliveriesAf, 52245.35, 0.02, 'YTD deliveries')
    close(result.page3.pumps.crookedRiverDemandAf, 0.0768 * 52245.35, 0.02, 'CRD')
    close(result.page3.pumps.ytdPumpedAf, 9455.23, 0.02, 'YTD pumped')
  })
})
