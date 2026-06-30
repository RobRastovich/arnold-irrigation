/**
 * Deletes all imported data (WeirBookItems, WeirBooks, Turnouts, Patrons)
 * then re-imports from the canonical CSV files.
 *
 * Run with: npx tsx scripts/reset-and-reimport.ts
 */
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── CSV paths ────────────────────────────────────────────────────────────────
const PATRON_CSV  = path.join(__dirname, '../dataFiles/Patrons/User.csv')
const TURNOUT_CSV = path.join(__dirname, '../dataFiles/TurnOuts/Turnout.csv')
const WEIR_CSV    = path.join(__dirname, '../dataFiles/WeirBook/shawnsweirreport.csv')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLegalName(row: any): string {
  const lname  = (row.lname  || '').trim()
  const fname  = (row.fname  || '').trim()
  const lname2 = (row.lname2 || '').trim()
  const fname2 = (row.fname2 || '').trim()
  if (!lname && !fname) return ''
  const primary   = [fname, lname].filter(Boolean).join(' ')
  const secondary = fname2 || lname2 ? [fname2, lname2].filter(Boolean).join(' ') : ''
  return secondary ? `${primary} / ${secondary}` : primary
}

function extractAccountFromDeliveryName(raw: string): string | null {
  const m = raw.match(/\b(\d{4,6})\b/)
  return m ? m[1] : null
}

// ─── Step 1: Delete all imported data ─────────────────────────────────────────

async function deleteAll() {
  console.log('Deleting WeirBookItems…')
  const wbi = await prisma.weirBookItem.deleteMany({})
  console.log(`  ${wbi.count} deleted`)

  console.log('Deleting WeirBooks…')
  const wb = await prisma.weirBook.deleteMany({})
  console.log(`  ${wb.count} deleted`)

  console.log('Deleting Turnouts…')
  const t = await prisma.turnout.deleteMany({})
  console.log(`  ${t.count} deleted`)

  console.log('Deleting InvoiceLineItems…')
  const ili = await prisma.invoiceLineItem.deleteMany({})
  console.log(`  ${ili.count} deleted`)

  console.log('Deleting Invoices…')
  const inv = await prisma.invoice.deleteMany({})
  console.log(`  ${inv.count} deleted`)

  console.log('Deleting TransactionItems…')
  const ti = await prisma.transactionItem.deleteMany({})
  console.log(`  ${ti.count} deleted`)

  console.log('Deleting Patrons…')
  const p = await prisma.patron.deleteMany({})
  console.log(`  ${p.count} deleted`)
}

// ─── Step 2: Import Patrons ────────────────────────────────────────────────────

async function importPatrons() {
  console.log('\nImporting patrons from User.csv…')
  const raw  = fs.readFileSync(PATRON_CSV, 'utf-8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true }) as any[]
  console.log(`  Parsed ${rows.length} rows`)

  let created = 0, skipped = 0, errors = 0

  for (const row of rows) {
    const accountNumber = String(row.Acctnbr || '').trim()
    if (!accountNumber) { skipped++; continue }

    const firstName  = (row.fname  || '').trim() || undefined
    const lastName   = (row.lname  || '').trim() || undefined
    const legalName  = buildLegalName(row) || undefined
    const street     = (row.street1 || '').trim()
    const city       = (row.city    || 'Bend').trim()
    const state      = (row.state   || 'OR').trim()
    const zip        = (row.zip     || '').trim()
    const phone      = (row.phone   || '').trim()
    const email      = (row.email   || '').trim()
    const wrAcres    = parseFloat(row.WRacres   || '0') || 0
    const asAcres    = parseFloat(row.Ttlasacres || '0') || 0

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
      console.error(`  ERROR patron ${accountNumber}: ${err.message}`)
      errors++
    }
  }
  console.log(`  Done: ${created} upserted, ${skipped} skipped, ${errors} errors`)
}

// ─── Step 3: Import Turnouts ──────────────────────────────────────────────────

async function importTurnouts() {
  console.log('\nImporting turnouts from Turnout.csv…')
  const raw  = fs.readFileSync(TURNOUT_CSV, 'utf-8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true }) as any[]
  console.log(`  Parsed ${rows.length} rows`)

  // Build patron lookup
  const patrons = await prisma.patron.findMany({ select: { accountNumber: true } })
  const knownAccounts = new Set(patrons.map((p) => p.accountNumber))

  let created = 0, skipped = 0, noPatron = 0, errors = 0

  for (const row of rows) {
    const accountNumber = String(row.Acctnbr || '').trim()
    const canal         = (row.Canal || '').trim()

    if (!accountNumber || !canal) { skipped++; continue }

    if (!knownAccounts.has(accountNumber)) {
      console.warn(`  WARN: account ${accountNumber} not in patrons — skipping turnout`)
      noPatron++
      continue
    }

    try {
      await prisma.turnout.create({
        data: {
          accountNumber,
          canal,
          gate:             (row.Weir         || '').trim(),
          deliveredAcres:   parseFloat(row.Acres || '0') || 0,
          acresOwned:       parseFloat(row.Acres || '0') || 0,
          taxLotNumber:     (row.Legaldesc || '').trim(),
          legalDescription: (row.Clegal   || '').trim(),
        },
      })
      created++
    } catch (err: any) {
      console.error(`  ERROR turnout ${accountNumber}: ${err.message}`)
      errors++
    }
  }
  console.log(`  Done: ${created} created, ${skipped} skipped (no acct/canal), ${noPatron} skipped (patron not found), ${errors} errors`)
}

// ─── Step 4: Import WeirBooks ─────────────────────────────────────────────────

async function importWeirBooks() {
  console.log('\nImporting weir books from shawnsweirreport.csv…')
  const raw  = fs.readFileSync(WEIR_CSV, 'utf-8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true }) as any[]
  console.log(`  Parsed ${rows.length} rows`)

  const patrons = await prisma.patron.findMany({ select: { accountNumber: true } })
  const knownAccounts = new Set(patrons.map((p) => p.accountNumber))

  // Collect unique canal+weir combos
  const weirBookMap = new Map<string, { canal: string; weirLocation: string }>()
  for (const row of rows) {
    const canal = (row.Canal || '').trim()
    const weir  = (row.Weir  || '').trim()
    if (!canal || !weir) continue
    const key = `${canal}||${weir}`
    if (!weirBookMap.has(key)) weirBookMap.set(key, { canal, weirLocation: weir })
  }

  // Upsert WeirBooks
  const weirBookIds = new Map<string, string>()
  let wbCreated = 0
  for (const [key, { canal, weirLocation }] of weirBookMap) {
    const weirNumber = `${canal}-${weirLocation}`
    const wb = await prisma.weirBook.upsert({
      where: { weirNumber },
      update: { canal, weirLocation: parseInt(weirLocation) || 0 },
      create: { weirNumber, canal, weirLocation: parseInt(weirLocation) || 0 },
    })
    weirBookIds.set(key, wb.id)
    wbCreated++
  }
  console.log(`  ${wbCreated} weir books upserted`)

  // Create WeirBookItems
  let itemCreated = 0, itemSkipped = 0, unresolved = 0, errors = 0
  for (const row of rows) {
    const canal = (row.Canal || '').trim()
    const weir  = (row.Weir  || '').trim()
    if (!canal || !weir) { itemSkipped++; continue }

    const key       = `${canal}||${weir}`
    const weirBookId = weirBookIds.get(key)
    if (!weirBookId) { itemSkipped++; continue }

    const deliveryName = (row['Delivery Name'] || row['DeliveryName'] || '').trim()
    const rawAcct      = extractAccountFromDeliveryName(deliveryName)
    const accountNumber = rawAcct && knownAccounts.has(rawAcct) ? rawAcct : null

    if (rawAcct && !accountNumber) {
      console.warn(`  WARN: account ${rawAcct} not in patrons (item on ${canal}-${weir}) — linking without account`)
      unresolved++
    }

    try {
      await prisma.weirBookItem.create({
        data: {
          weirBookId,
          accountNumber,
          acres:        parseFloat(row.Acres    || '0') || 0,
          privateAcres: parseFloat(row.PvtAcres || '0') || 0,
          description:  (row.Location || '').trim() || null,
          notes:        (row.Weirmemo || '').trim() || null,
        },
      })
      itemCreated++
    } catch (err: any) {
      console.error(`  ERROR weir item: ${err.message}`)
      errors++
    }
  }
  console.log(`  ${itemCreated} items created, ${itemSkipped} skipped, ${unresolved} unresolved accounts, ${errors} errors`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Step 1: Delete all imported data ===')
  await deleteAll()

  console.log('\n=== Step 2: Import Patrons ===')
  await importPatrons()

  console.log('\n=== Step 3: Import Turnouts ===')
  await importTurnouts()

  console.log('\n=== Step 4: Import Weir Books ===')
  await importWeirBooks()

  console.log('\n✓ All done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
