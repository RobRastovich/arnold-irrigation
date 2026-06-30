import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CSV_PATH = path.join(__dirname, '../dataFiles/Patrons/User.csv')

interface CsvRow {
  Acctnbr: string
  lname: string
  fname: string
  lname2: string
  fname2: string
  street1: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  WRacres: string
  Ttlasacres: string
  [key: string]: string
}

function buildLegalName(row: CsvRow): string {
  const lname  = (row.lname  || '').trim()
  const fname  = (row.fname  || '').trim()
  const lname2 = (row.lname2 || '').trim()
  const fname2 = (row.fname2 || '').trim()
  if (!lname && !fname) return ''
  const primary   = [fname, lname].filter(Boolean).join(' ')
  const secondary = fname2 || lname2 ? [fname2, lname2].filter(Boolean).join(' ') : ''
  return secondary ? `${primary} / ${secondary}` : primary
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

  let created = 0
  let skipped = 0
  let errors = 0

  for (const row of rows) {
    const accountNumber = String(row.Acctnbr || '').trim()
    if (!accountNumber) { skipped++; continue }

    const firstName = (row.fname || '').trim() || undefined
    const lastName  = (row.lname || '').trim() || undefined
    const legalName = buildLegalName(row) || undefined
    const street    = (row.street1 || '').trim()
    const city      = (row.city    || 'Bend').trim()
    const state     = (row.state   || 'OR').trim()
    const zip       = (row.zip     || '').trim()
    const phone     = (row.phone   || '').trim() || undefined
    const email     = (row.email   || '').trim() || undefined
    const wrAcres   = parseFloat(row.WRacres    || '0') || 0
    const asAcres   = parseFloat(row.Ttlasacres || '0') || 0

    try {
      await prisma.patron.upsert({
        where: { accountNumber },
        update: {
          firstName,
          lastName,
          legalName,
          serviceStreet: street || '(Address unknown)',
          serviceCity:   city,
          serviceState:  state,
          serviceZip:    zip || '00000',
          primaryPhone:  phone,
          primaryEmail:  email,
          totalWaterRightAcres: wrAcres,
          assessedAcres: asAcres,
        },
        create: {
          accountNumber,
          firstName,
          lastName,
          legalName,
          serviceStreet: street || '(Address unknown)',
          serviceCity:   city,
          serviceState:  state,
          serviceZip:    zip || '00000',
          serviceCountry: 'US',
          primaryPhone:  phone,
          primaryEmail:  email,
          totalWaterRightAcres: wrAcres,
          assessedAcres: asAcres,
          isActive: true,
        },
      })
      created++
    } catch (err: any) {
      console.error(`  ERROR on account ${accountNumber}: ${err.message}`)
      errors++
    }
  }

  console.log(`\nDone: ${created} upserted, ${skipped} skipped, ${errors} errors`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
