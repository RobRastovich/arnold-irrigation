/**
 * Imports WeirBook and WeirBookItem records from shawnsweirreport.csv.
 *
 * Strategy:
 *  - Each unique (Canal, Weir) combination → one WeirBook record
 *    weirNumber = "<CANAL>-<WEIRLOC>"  (unique key)
 *    weirLocation = Weir (integer)
 *    canal = Canal
 *
 *  - Each row → one WeirBookItem on that WeirBook
 *    acres        = Acres
 *    privateAcres = PvtAcres
 *    description  = Location
 *    notes        = Weirmemo
 *    accountNumber extracted from end of "Delivery Name" field
 *                   e.g. "Robinson, Wendy  10500" → "10500"
 *
 * Fields not yet in schema (kept here for future iteration):
 *    Delivery Name    → patron name (account# extracted from it)
 *    Delivery Address → delivery address
 *    Delivery Phone   → delivery phone
 *    Split            → weir split position
 */

import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CSV_PATH = path.join(__dirname, '../dataFiles/WeirBook/shawnsweirreport.csv')

interface CsvRow {
  Canal: string
  Weir: string
  Split: string
  Acres: string
  PvtAcres: string
  Location: string
  'Delivery Name': string
  'Delivery Address': string
  'Delivery Phone': string
  Weirmemo: string
  [key: string]: string
}

/**
 * Extract trailing account number from "Delivery Name" field.
 * e.g. "Robinson, Wendy  10500" → "10500"
 *      "  " or "" → null
 */
function extractAccountNumber(deliveryName: string): string | null {
  const trimmed = deliveryName.trim()
  if (!trimmed) return null
  const match = trimmed.match(/(\d{3,6})\s*$/)
  return match ? match[1] : null
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

  // Pre-fetch valid account numbers for FK validation
  const patrons = await prisma.patron.findMany({ select: { accountNumber: true } })
  const validAccounts = new Set(patrons.map((p) => p.accountNumber))

  // Cache of weirNumber → WeirBook.id to avoid repeated upserts
  const weirBookCache = new Map<string, string>()

  let weirBooksCreated = 0
  let itemsCreated = 0
  let itemsSkippedNoWeir = 0
  let accountsNotFound = 0
  let errors = 0

  for (const row of rows) {
    const canal = (row.Canal || '').trim()
    const weirRaw = (row.Weir || '').trim()

    if (!canal || !weirRaw) {
      itemsSkippedNoWeir++
      continue
    }

    const weirLocation = parseInt(weirRaw, 10)
    if (isNaN(weirLocation)) {
      itemsSkippedNoWeir++
      continue
    }

    const weirNumber = `${canal}-${weirLocation}`

    // Upsert WeirBook for this (canal, weirLocation) combination
    if (!weirBookCache.has(weirNumber)) {
      try {
        const wb = await prisma.weirBook.upsert({
          where: { weirNumber },
          update: {},
          create: {
            weirNumber,
            canal,
            weirLocation,
          },
        })
        weirBookCache.set(weirNumber, wb.id)
        weirBooksCreated++
      } catch (err: any) {
        console.error(`  ERROR upserting WeirBook ${weirNumber}: ${err.message}`)
        errors++
        continue
      }
    }

    const weirBookId = weirBookCache.get(weirNumber)!

    // Resolve account number from Delivery Name
    const rawDeliveryName = row['Delivery Name'] || ''
    const accountNumber = extractAccountNumber(rawDeliveryName)
    const resolvedAccount = accountNumber && validAccounts.has(accountNumber) ? accountNumber : null

    if (accountNumber && !resolvedAccount) {
      console.warn(`  WARN: account ${accountNumber} not in patrons (item on ${weirNumber}) — linking without account`)
      accountsNotFound++
    }

    const acres       = parseFloat(row.Acres)    || 0
    const privateAcres = parseFloat(row.PvtAcres) || 0
    const description = (row.Location || '').trim() || null
    const notes       = (row.Weirmemo || '').trim() || null

    try {
      await prisma.weirBookItem.create({
        data: {
          weirBookId,
          accountNumber: resolvedAccount,
          acres,
          privateAcres,
          description,
          notes,
        },
      })
      itemsCreated++
    } catch (err: any) {
      console.error(`  ERROR creating WeirBookItem on ${weirNumber}: ${err.message}`)
      errors++
    }
  }

  console.log(`
Done:
  ${weirBooksCreated}  weir books upserted
  ${itemsCreated}      weir book items created
  ${itemsSkippedNoWeir}  rows skipped (no canal/weir)
  ${accountsNotFound}  items with unresolved account numbers
  ${errors}            errors
  `)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
