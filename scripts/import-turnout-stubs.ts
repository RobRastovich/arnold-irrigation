/**
 * Creates stub Patron records for any account numbers in the Turnout CSV
 * that don't yet exist in the patrons table.
 * Run this BEFORE import-turnouts.ts when patron records are missing.
 */
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TURNOUT_CSV = path.join(__dirname, '../dataFiles/TurnOuts/Turnout.csv')

async function main() {
  const raw = fs.readFileSync(TURNOUT_CSV, 'utf-8')
  const rows: any[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })

  // Unique account numbers from turnout CSV
  const turnoutAccounts = [...new Set(rows.map((r) => String(r.Acctnbr || '').trim()).filter(Boolean))]

  // Existing patron accounts
  const existing = await prisma.patron.findMany({ select: { accountNumber: true } })
  const existingSet = new Set(existing.map((p) => p.accountNumber))

  const missing = turnoutAccounts.filter((a) => !existingSet.has(a))
  console.log(`${missing.length} account numbers in Turnout CSV not in patrons table — creating stubs...`)

  let created = 0
  let errors = 0

  for (const accountNumber of missing) {
    try {
      await prisma.patron.create({
        data: {
          accountNumber,
          firstName: 'Unknown',
          lastName: accountNumber,       // use account# as lastName so it's findable
          legalName: `Stub - Account ${accountNumber}`,
          serviceStreet: '(Address unknown)',
          serviceCity: 'Bend',
          serviceState: 'OR',
          serviceZip: '00000',
          serviceCountry: 'US',
          primaryPhone: '',
          primaryEmail: '',
          totalWaterRightAcres: 0,
          assessedAcres: 0,
          isActive: false,               // mark inactive so stubs are easy to filter
        },
      })
      created++
    } catch (err: any) {
      console.error(`  ERROR creating stub for ${accountNumber}: ${err.message}`)
      errors++
    }
  }

  console.log(`\nDone: ${created} stubs created, ${errors} errors`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
