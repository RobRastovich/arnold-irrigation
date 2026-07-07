import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET a single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
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
        },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
