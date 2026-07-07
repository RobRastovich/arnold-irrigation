/**
 * Import Allocation.csv into Transaction + TransactionItem tables.
 *
 * Mapping:
 *   Ec (per item): "T" → TRANSFER, "C" → CANCEL, "A" → ACTIVE
 *   Transno: groups items into one Transaction; blank rows use recno as the key
 *   One Transaction per unique Transno (or recno when Transno is blank)
 *   Toacct: lookup to Patron by accountNumber; if multiple values (excluding
 *           the row's own Acctnbr), duplicate the item for each to-account.
 *   Memo: mapped to the memo field on TransactionItem.
 *
 * Run with: npx tsx scripts/import-allocations.ts
 */
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient, TransactionType } from '@prisma/client'

const prisma = new PrismaClient()

const CSV_PATH = path.join(__dirname, '../dataFiles/Transactons/Allocation.csv')

function mapEc(ec: string): TransactionType {
  const val = (ec || '').trim().toUpperCase()
  if (val === 'T') return TransactionType.TRANSFER
  if (val === 'C') return TransactionType.CANCEL
  return TransactionType.ACTIVE
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  // Reject obviously bogus dates (1905 placeholder)
  if (isNaN(d.getTime()) || d.getFullYear() < 1950) return null
  return d
}

/**
 * Parse the Toacct field, which may contain one or more account numbers
 * separated by slashes, commas, or spaces. Filters out the source accountNumber
 * itself. Returns an empty array when there are no qualifying to-accounts.
 */
function parseToAccounts(raw: string, sourceAccountNumber: string): string[] {
  if (!raw) return []
  return raw
    .split(/[\/,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== sourceAccountNumber)
}

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8')
  const rows: any[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })
  console.log(`Parsed ${rows.length} rows from Allocation.csv`)

  // Build patron account number lookup
  const patrons = await prisma.patron.findMany({ select: { accountNumber: true } })
  const knownAccounts = new Set(patrons.map((p) => p.accountNumber))

  // Group rows by transaction key: Transno if present, else "recno-<recno>"
  const txGroups = new Map<string, any[]>()
  for (const row of rows) {
    const transno = (row.Transno || '').trim()
    const key = transno ? `T-${transno}` : `R-${row.recno}`
    if (!txGroups.has(key)) txGroups.set(key, [])
    txGroups.get(key)!.push(row)
  }

  console.log(`Found ${txGroups.size} unique transactions`)

  let txCreated = 0, txSkipped = 0
  let itemCreated = 0, itemSkipped = 0, itemNoPatron = 0, errors = 0

  for (const [txKey, txRows] of txGroups) {
    const transactionNumber = txKey

    // Upsert the Transaction (type is now on items, not the header)
    let transaction: { id: string }
    try {
      transaction = await prisma.transaction.upsert({
        where: { transactionNumber },
        update: {},
        create: { transactionNumber },
      })
      txCreated++
    } catch (err: any) {
      console.error(`  ERROR creating transaction ${transactionNumber}: ${err.message}`)
      txSkipped++
      errors++
      continue
    }

    // Create TransactionItems for each row
    for (const row of txRows) {
      const accountNumber = String(row.Acctnbr || '').trim()
      if (!accountNumber) { itemSkipped++; continue }

      if (!knownAccounts.has(accountNumber)) {
        console.warn(`  WARN: account ${accountNumber} not in patrons — skipping item (recno ${row.recno})`)
        itemNoPatron++
        continue
      }

      const type            = mapEc(row.Ec)
      const legalDescription = (row.Legaldesc || '').trim() || null
      const taxLot           = (row.Taxlot    || '').trim() || null
      const subdivision      = String(row.Subdiv || '').trim() || null
      const parcelNumber     = (row.Parcel    || '').trim() || null
      const waterRightAcres  = parseFloat(row.WRacres || '') || null
      const transactionDate  = parseDate(row.Transdate)
      const memo             = (row.Memo || '').trim() || null

      // Resolve to-accounts: filter unknown patrons, exclude self
      const rawToAccounts = parseToAccounts(String(row.Toacct || ''), accountNumber)
      const toAccounts = rawToAccounts.filter((a) => {
        if (!knownAccounts.has(a)) {
          console.warn(`  WARN: toacct ${a} not in patrons — skipping to-account for recno ${row.recno}`)
          return false
        }
        return true
      })

      // If no qualifying to-accounts, create one item with toAccountNumber = null
      // If one or more, create one item per to-account
      const toAccountList = toAccounts.length > 0 ? toAccounts : [null]

      for (const toAccountNumber of toAccountList) {
        try {
          await prisma.transactionItem.create({
            data: {
              transactionId:   transaction.id,
              accountNumber,
              type,
              toAccountNumber,
              parcelNumber,
              legalDescription,
              taxLot,
              subdivision,
              waterRightAcres,
              transactionDate,
              memo,
            },
          })
          itemCreated++
        } catch (err: any) {
          console.error(`  ERROR item recno ${row.recno} acct ${accountNumber} toAcct ${toAccountNumber}: ${err.message}`)
          errors++
        }
      }
    }
  }

  console.log(`
Done:
  ${txCreated}  transactions upserted
  ${txSkipped}  transactions skipped (errors)
  ${itemCreated}  items created
  ${itemSkipped}  items skipped (no account number)
  ${itemNoPatron}  items skipped (patron not found)
  ${errors}  errors total
`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
