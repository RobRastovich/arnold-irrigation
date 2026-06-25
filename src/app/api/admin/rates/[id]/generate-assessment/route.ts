import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

async function nextInvoiceNumber(): Promise<string> {
  const latest = await prisma.invoice.findFirst({
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  })
  if (!latest) return 'ASM-000001'
  const num = parseInt(latest.invoiceNumber.replace('ASM-', ''), 10)
  return `ASM-${String(num + 1).padStart(6, '0')}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateId = params.id

  // Load rate with its items
  const rate = await prisma.rate.findUnique({
    where: { id: rateId },
    include: {
      items: { include: { rateType: true } },
    },
  })
  if (!rate) return NextResponse.json({ error: 'Rate not found' }, { status: 404 })
  if (rate.items.length === 0) {
    return NextResponse.json({ error: 'Rate has no items — add rate items before generating assessments' }, { status: 400 })
  }

  // Check if assessments already exist for this rate
  const existing = await prisma.invoice.count({ where: { rateId } })
  if (existing > 0) {
    return NextResponse.json({
      error: `Assessments already generated for this rate (${existing} assessments exist). Void existing assessments before regenerating.`,
    }, { status: 409 })
  }

  // Load all active patrons with their turnouts
  const patrons = await prisma.patron.findMany({
    where: { isActive: true },
    include: {
      turnouts: {
        select: {
          taxLotNumber: true,
          acresOwned: true,
        },
      },
    },
  })

  if (patrons.length === 0) {
    return NextResponse.json({ error: 'No active patrons found' }, { status: 400 })
  }

  const created: string[] = []

  for (const patron of patrons) {
    // Compute patron-level quantities
    const distinctTaxLots = new Set(
      patron.turnouts.map((t: { taxLotNumber: string; acresOwned: number }) => t.taxLotNumber).filter(Boolean)
    ).size
    const totalAcresOwned = patron.turnouts.reduce(
      (sum: number, t: { taxLotNumber: string; acresOwned: number }) => sum + (t.acresOwned ?? 0), 0
    )

    // Build line items
    const lineItems: {
      rateItemId: string
      rateCode: string
      description: string
      chargeType: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }[] = []

    for (const rateItem of rate.items) {
      const unitPrice = Number(rateItem.assessment)
      let qty = 0

      if (rateItem.chargeType === 'TAXLOT') {
        qty = distinctTaxLots
      } else if (rateItem.chargeType === 'ACRE_OF_WATER') {
        qty = totalAcresOwned
      } else if (rateItem.chargeType === 'PER_SEASON') {
        qty = 1
      }

      if (qty === 0 && rateItem.chargeType !== 'PER_SEASON') continue

      lineItems.push({
        rateItemId: rateItem.id,
        rateCode: rateItem.rateCode,
        description: rateItem.rateType?.name ?? rateItem.rateCode,
        chargeType: rateItem.chargeType,
        quantity: qty,
        unitPrice,
        lineTotal: Math.round(qty * unitPrice * 100) / 100,
      })
    }

    const totalAmount = lineItems.reduce((s, li) => s + li.lineTotal, 0)

    const invoiceNumber = await nextInvoiceNumber()

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        accountNumber: patron.accountNumber,
        rateId,
        status: 'DRAFT',
        invoiceDate: new Date(),
        firstName: patron.firstName,
        lastName: patron.lastName,
        mailingStreet: patron.mailingStreet,
        mailingCity: patron.mailingCity,
        mailingState: patron.mailingState,
        mailingZip: patron.mailingZip,
        serviceStreet: patron.serviceStreet,
        serviceCity: patron.serviceCity,
        serviceState: patron.serviceState,
        serviceZip: patron.serviceZip,
        totalAmount,
        lineItems: {
          create: lineItems.map((li) => ({
            rateItemId: li.rateItemId,
            rateCode: li.rateCode,
            description: li.description,
            chargeType: li.chargeType as any,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            lineTotal: li.lineTotal,
          })),
        },
      },
    })

    created.push(invoice.id)
  }

  return NextResponse.json({
    success: true,
    assessmentsCreated: created.length,
    message: `Generated ${created.length} assessment${created.length !== 1 ? 's' : ''} for rate year ${rate.year}`,
  }, { status: 201 })
}
