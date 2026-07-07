import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CSV_PATH = path.join(__dirname, '../dataFiles/TurnOuts/Turnout.csv')

// ---------------------------------------------------------------------------
// CSV field → Turnout schema mapping
//
//  Acctnbr      → accountNumber  (FK to Patron.accountNumber)
//  Canal        → canal
//  Weir         → gate           (weir number stored as string)
//  Acres        → deliveredAcres + acresOwned (same source — best available)
//  Clegal       → taxLotNumber
//  Legaldesc    → legalDescription
//
// Fields NOT yet in the schema (saved here for future migration):
//  Split        → weir split position
//  Use          → use type (IRRIG / INDUS / QUASI / POND …)
//  Status       → status (OPMV / INCR / IRRIG …)
//  DelvAddress  → delivery address
//  DelvName     → delivery contact name
//  DelvFone     → delivery contact phone
//  Weirmemo     → weir memo / notes
//  Riverlease   → river lease flag
// ---------------------------------------------------------------------------

interface CsvRow {
  Acctnbr: string
  Legaldesc: string
  Clegal: string
  Canal: string
  Weir: string
  Split: string
  Use: string
  Acres: string
  Status: string
  DelvAddress: string
  DelvName: string
  DelvFone: string
  Weirmemo: string
  Riverlease: string
  [key: string]: string
}

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8')

  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })

  console.log(`Parsed ${rows.length} rows from CSV`)

  // Wipe existing data so re-runs don't duplicate
  console.log('Deleting existing turnouts...')
  await prisma.turnout.deleteMany({})
  console.log('Deleted.')

  // Pre-fetch all valid account numbers so we can skip orphan rows fast
  const patrons = await prisma.patron.findMany({ select: { accountNumber: true } })
  const validAccounts = new Set(patrons.map((p) => p.accountNumber))
  console.log(`Found ${validAccounts.size} patron accounts in DB`)

  let created = 0
  let skippedNoAccount = 0
  let skippedNoCanal = 0
  let errors = 0

  for (const row of rows) {
    const accountNumber = String(row.Acctnbr || '').trim()

    if (!accountNumber) { skippedNoAccount++; continue }

    if (!validAccounts.has(accountNumber)) {
      console.warn(`  SKIP: account ${accountNumber} not found in patrons table`)
      skippedNoAccount++
      continue
    }

    const canal = (row.Canal || '').trim()
    if (!canal) { skippedNoCanal++; continue }

    const gate       = (row.Weir || '').trim()         // weir number
    const use        = (row.Use || '').trim() || null
    const acres      = parseFloat(row.Acres) || 0
    const taxLot     = (row.Clegal || '').trim()
    const legalDesc  = (row.Legaldesc || '').trim()

    try {
      await prisma.turnout.create({
        data: {
          accountNumber,
          canal,
          gate,
          use,
          deliveredAcres: acres,
          acresOwned: acres,
          taxLotNumber: taxLot,
          legalDescription: legalDesc,
        },
      })
      created++
    } catch (err: any) {
      console.error(`  ERROR account ${accountNumber} canal ${canal}: ${err.message}`)
      errors++
    }
  }

  console.log(`
Done:
  ${created}            created
  ${skippedNoAccount}   skipped (account not in patrons)
  ${skippedNoCanal}     skipped (no canal value)
  ${errors}             errors
  `)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
