import { PrismaClient, GageRole, GageValueSource, GageValueUnit } from '@prisma/client'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { GAGE_CATALOG } from '../src/lib/storage-report/stations'
import { utcDate } from '../src/lib/storage-report/assemble'
import type { CapacityTables } from '../src/lib/storage-report/types'

const prisma = new PrismaClient()

function loadJson<T>(name: string): T {
  const file = path.join(__dirname, '..', 'src/lib/storage-report/fixtures', name)
  return JSON.parse(readFileSync(file, 'utf8')) as T
}

async function seedStations() {
  for (const station of GAGE_CATALOG) {
    await prisma.gageStation.upsert({
      where: { stationNbr: station.stationNbr },
      update: {
        name: station.name,
        role: station.role as GageRole,
        seriesKey: station.seriesKey,
        source: station.source as GageValueSource,
        defaultCfs: station.defaultCfs,
        sortOrder: station.sortOrder,
        isActive: true,
      },
      create: {
        stationNbr: station.stationNbr,
        name: station.name,
        role: station.role as GageRole,
        seriesKey: station.seriesKey,
        source: station.source as GageValueSource,
        defaultCfs: station.defaultCfs,
        sortOrder: station.sortOrder,
      },
    })
  }
  console.log(`Upserted ${GAGE_CATALOG.length} gage stations`)
}

async function seedCapacity() {
  const tables = loadJson<CapacityTables>('capacity-tables.json')
  const reservoirs: { key: keyof CapacityTables; code: string }[] = [
    { key: 'cranePrairie', code: 'CRANE_PRAIRIE' },
    { key: 'wickiup', code: 'WICKIUP' },
    { key: 'crescentLake', code: 'CRESCENT_LAKE' },
  ]
  for (const { key, code } of reservoirs) {
    await prisma.reservoirCapacityPoint.deleteMany({ where: { reservoir: code } })
    await prisma.reservoirCapacityPoint.createMany({
      data: tables[key].map((p) => ({
        reservoir: code,
        elevation: p.elevation,
        acreFeet: p.acreFeet,
        surfaceAcres: p.surfaceAcres,
      })),
    })
    console.log(`Seeded ${tables[key].length} ${code} capacity points`)
  }
}

async function seedWaterRights() {
  const golden = loadJson<any>('golden-period-2026-08.json')
  for (const [rightName, seasons] of Object.entries(golden.maxRightCfsBySeason as Record<string, number[]>)) {
    for (let seasonIndex = 0; seasonIndex < seasons.length; seasonIndex++) {
      await prisma.districtWaterRight.upsert({
        where: { rightName_seasonIndex: { rightName, seasonIndex } },
        update: { maxCfs: seasons[seasonIndex] },
        create: { rightName, seasonIndex, maxCfs: seasons[seasonIndex] },
      })
    }
  }
  console.log('Seeded Duffy max-right table')

  await prisma.instreamLease.deleteMany({ where: { reportId: null } })
  const instream = golden.instream
  for (const [district, cfs] of Object.entries(instream.leasesCfs as Record<string, number>)) {
    await prisma.instreamLease.create({
      data: { district, kind: 'LEASE', cfs },
    })
  }
  for (const [district, cfs] of Object.entries(instream.permanentCfs as Record<string, number>)) {
    await prisma.instreamLease.create({
      data: { district, kind: 'PERMANENT', cfs },
    })
  }
  for (const [district, acres] of Object.entries(instream.directAcres as Record<string, number>)) {
    await prisma.instreamLease.create({
      data: { district, kind: 'DIRECT_ACRES', cfs: 0, acres },
    })
  }
  console.log('Seeded default ISWR / lease rows')
}

async function seedPumps() {
  const golden = loadJson<any>('golden-period-2026-08.json')
  for (const month of golden.pumps.months) {
    await prisma.pumpSeasonMonth.upsert({
      where: { waterYear_month: { waterYear: golden.pumps.waterYear, month: month.month } },
      update: { pumpedAf: month.pumpedAf, deliveriesAf: month.deliveriesAf },
      create: {
        waterYear: golden.pumps.waterYear,
        month: month.month,
        pumpedAf: month.pumpedAf,
        deliveriesAf: month.deliveriesAf,
      },
    })
  }
  console.log('Seeded NUID pump months')
}

async function seedGoldenDaily() {
  const golden = loadJson<any>('golden-period-2026-08.json')
  const stations = await prisma.gageStation.findMany()
  const byKey = Object.fromEntries(stations.map((s) => [s.seriesKey, s]))
  let count = 0
  for (const row of golden.daily) {
    const date = utcDate(row.date)
    for (const station of GAGE_CATALOG) {
      const dbStation = byKey[station.seriesKey]
      if (!dbStation) continue
      const raw = row[station.seriesKey]
      if (raw == null) continue
      const unit: GageValueUnit = station.role === 'RESERVOIR' ? 'STAGE_FT' : station.role === 'EVAP' ? 'EVAP_IN' : 'CFS'
      const value = station.role === 'RESERVOIR'
        ? (station.seriesKey === 'cranePrairieElev' ? row.cranePrairieElev
          : station.seriesKey === 'wickiupElev' ? row.wickiupElev
          : row.crescentElev)
        : raw
      if (value == null) continue
      await prisma.gageDailyValue.upsert({
        where: { stationId_date_unit: { stationId: dbStation.id, date, unit } },
        update: { value, source: 'MANUAL', publishedStatus: 'Corrected' },
        create: {
          stationId: dbStation.id,
          date,
          value,
          unit,
          source: 'MANUAL',
          publishedStatus: 'Corrected',
        },
      })
      count++
      if (station.role === 'RESERVOIR') {
        const contentsKey =
          station.seriesKey === 'cranePrairieElev' ? 'cranePrairieContentsAf'
          : station.seriesKey === 'wickiupElev' ? 'wickiupContentsAf'
          : 'crescentContentsAf'
        const contents = row[contentsKey]
        if (contents != null) {
          await prisma.gageDailyValue.upsert({
            where: { stationId_date_unit: { stationId: dbStation.id, date, unit: 'CONTENTS_AF' } },
            update: { value: contents, source: 'MANUAL', publishedStatus: 'Corrected' },
            create: {
              stationId: dbStation.id,
              date,
              value: contents,
              unit: 'CONTENTS_AF',
              source: 'MANUAL',
              publishedStatus: 'Corrected',
            },
          })
          count++
        }
      }
    }
  }
  console.log(`Seeded ${count} golden-period daily values`)
}

async function seedDemoReport() {
  const golden = loadJson<any>('golden-period-2026-08.json')
  const existing = await prisma.storageReport.findFirst({
    where: { startDate: utcDate(golden.period.startDate), endDate: utcDate(golden.period.endDate) },
  })
  if (existing) {
    console.log('Golden-period report already exists')
    return
  }
  const report = await prisma.storageReport.create({
    data: {
      startDate: utcDate(golden.period.startDate),
      endDate: utcDate(golden.period.endDate),
      dateCode: golden.period.dateCode,
      waterYear: golden.period.waterYear,
      status: 'DRAFT',
      dataQuality: 'CORRECTED',
      useLegacyCpInflow: true,
      crescentOctMinContentsAf: 5652.54,
      notes: 'Workbook golden period (Excel serial 46249–46265)',
    },
  })
  const opening = []
  for (const [district, reservoirs] of Object.entries(golden.openingBalances)) {
    for (const [reservoir, acreFeet] of Object.entries(reservoirs as Record<string, number>)) {
      opening.push({ reportId: report.id, district, reservoir, acreFeet })
    }
  }
  await prisma.storageReportOpeningBalance.createMany({ data: opening })
  const defaults = await prisma.instreamLease.findMany({ where: { reportId: null } })
  if (defaults.length) {
    await prisma.instreamLease.createMany({
      data: defaults.map((row) => ({
        reportId: report.id,
        district: row.district,
        kind: row.kind,
        cfs: row.cfs,
        acres: row.acres,
      })),
    })
  }
  await prisma.storageReportOverride.createMany({
    data: Object.entries(golden.overrides).map(([key, value]) => ({
      reportId: report.id,
      key,
      value: Number(value),
      reason: 'Workbook yellow-cell override',
    })),
  })
  console.log('Created golden-period storage report', report.id)
}

async function main() {
  console.log('Seeding storage report reference data...')
  await seedStations()
  await seedCapacity()
  await seedWaterRights()
  await seedPumps()
  await seedGoldenDaily()
  await seedDemoReport()
  console.log('Storage report seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
