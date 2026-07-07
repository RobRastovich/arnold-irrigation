import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET all transactions (optionally filtered by accountNumber)
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get('accountNumber')

    const where: any = {}
    if (accountNumber) {
      where.items = { some: { accountNumber } }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            patron: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                accountNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new transaction with items
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    const validTypes = ['CANCEL', 'TRANSFER', 'ACTIVE']

    // Validate all patron account numbers and types exist
    for (const item of items) {
      if (!validTypes.includes(item.type)) {
        return NextResponse.json({ error: `Invalid transaction type: ${item.type}` }, { status: 400 })
      }
      const patron = await prisma.patron.findUnique({
        where: { accountNumber: item.accountNumber },
      })
      if (!patron) {
        return NextResponse.json(
          { error: `Patron with account number ${item.accountNumber} not found` },
          { status: 404 }
        )
      }
      if (item.toAccountNumber) {
        const toPatron = await prisma.patron.findUnique({
          where: { accountNumber: item.toAccountNumber },
        })
        if (!toPatron) {
          return NextResponse.json(
            { error: `To-account patron ${item.toAccountNumber} not found` },
            { status: 404 }
          )
        }
      }
    }

    // Generate auto-incrementing transaction number in format 0000
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: { transactionNumber: 'desc' },
    })
    const nextNumber = lastTransaction
      ? String(parseInt(lastTransaction.transactionNumber, 10) + 1).padStart(4, '0')
      : '0001'

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const transaction = await prisma.transaction.create({
      data: {
        transactionNumber: nextNumber,
        items: {
          create: items.map((item: any) => ({
            accountNumber: item.accountNumber,
            type: item.type,
            toAccountNumber: item.toAccountNumber || null,
            parcelNumber: item.parcelNumber || null,
            legalDescription: item.legalDescription || null,
            taxLot: item.taxLot || null,
            subdivision: item.subdivision || null,
            waterRightAcres: item.waterRightAcres ? parseFloat(item.waterRightAcres) : null,
            transactionDate: item.transactionDate ? new Date(item.transactionDate) : null,
            memo: item.memo || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            patron: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                accountNumber: true,
              },
            },
          },
        },
      },
    })

    clearCurrentUserId()

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
