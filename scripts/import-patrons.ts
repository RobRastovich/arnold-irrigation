import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CSV_PATH = path.join(__dirname, '../dataFiles/Patrons/Cust.csv')

interface CsvRow {
  acctnbr: string
  Name: string
  Phone: string
  Address1: string
  Address2: string
  Address3: string
  Zip: string
  [key: string]: string
}

/**
 * Parse "Last, First Middle" or "First Last" name into firstName / lastName.
 * The CSV uses "Last, First..." format for most entries.
 */
function parseName(raw: string): { firstName: string; lastName: string } {
  const name = raw.trim()
  const commaIdx = name.indexOf(',')
  if (commaIdx !== -1) {
    const lastName = name.substring(0, commaIdx).trim()
    const firstName = name.substring(commaIdx + 1).trim()
    return { firstName: firstName || 'Unknown', lastName: lastName || 'Unknown' }
  }
  // No comma — treat as "First Last..."
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
  }
  return { firstName: name || 'Unknown', lastName: 'Unknown' }
}

/**
 * Parse Address2 field which may contain "Bend, OR" or just a city.
 * Returns { city, state }.
 */
function parseCityState(address2: string): { city: string; state: string } {
  const val = address2.trim()
  if (!val) return { city: 'Bend', state: 'OR' }

  const commaIdx = val.indexOf(',')
  if (commaIdx !== -1) {
    const city = val.substring(0, commaIdx).trim()
    const state = val.substring(commaIdx + 1).trim()
    return { city: city || 'Bend', state: state || 'OR' }
  }

  // Single word that looks like "Bend" → assume it's the city
  const lower = val.toLowerCase()
  if (lower === 'bend' || lower.length < 30) {
    return { city: val, state: 'OR' }
  }

  return { city: 'Bend', state: 'OR' }
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
    const accountNumber = String(row.acctnbr || '').trim()
    if (!accountNumber) { skipped++; continue }

    const { firstName, lastName } = parseName(row.Name || '')
    const street = (row.Address1 || '').trim().replace(/\s+/g, ' ')
    const { city, state } = parseCityState(row.Address2 || '')
    const zip = (row.Zip || '').trim()
    const phone = (row.Phone || '').trim()

    // Skip rows with no meaningful address
    const serviceStreet = street || '(Address unknown)'
    const serviceCity   = city || 'Bend'
    const serviceState  = state || 'OR'
    const serviceZip    = zip || '00000'

    try {
      await prisma.patron.upsert({
        where: { accountNumber },
        update: {
          firstName,
          lastName,
          legalName: (row.Name || '').trim(),
          serviceStreet,
          serviceCity,
          serviceState,
          serviceZip,
          primaryPhone: phone,
        },
        create: {
          accountNumber,
          firstName,
          lastName,
          legalName: (row.Name || '').trim(),
          serviceStreet,
          serviceCity,
          serviceState,
          serviceZip,
          serviceCountry: 'US',
          primaryPhone: phone,
          primaryEmail: '',
          totalWaterRightAcres: 0,
          assessedAcres: 0,
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
