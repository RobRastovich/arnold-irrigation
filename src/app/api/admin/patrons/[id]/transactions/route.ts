import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET all transaction items for a patron
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patron = await prisma.patron.findUnique({
      where: { id: params.id },
      select: { accountNumber: true },
    })

    if (!patron) {
      return NextResponse.json({ error: 'Patron not found' }, { status: 404 })
    }

    const transactionItems = await prisma.transactionItem.findMany({
      where: { accountNumber: patron.accountNumber },
      include: {
        transaction: true,
        toPatron: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            legalName: true,
            accountNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(transactionItems)
  } catch (error) {
    console.error('Error fetching transaction items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
