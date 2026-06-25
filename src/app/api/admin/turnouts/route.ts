import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET all turnouts (optionally filtered by accountNumber)
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
      where.accountNumber = accountNumber
    }

    const turnouts = await prisma.turnout.findMany({
      where,
      include: {
        notes: true,
        patron: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(turnouts)
  } catch (error) {
    console.error('Error fetching turnouts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new turnout
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      accountNumber,
      canal,
      gate,
      deliveredAcres,
      acresOwned,
      taxLotNumber,
      legalDescription,
    } = body

    // Verify patron exists
    const patron = await prisma.patron.findUnique({
      where: { accountNumber },
    })

    if (!patron) {
      return NextResponse.json({ error: 'Patron not found' }, { status: 404 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const turnout = await prisma.turnout.create({
      data: {
        accountNumber,
        canal,
        gate,
        deliveredAcres: parseFloat(deliveredAcres),
        acresOwned: parseFloat(acresOwned),
        taxLotNumber,
        legalDescription,
      },
      include: {
        notes: true,
        patron: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    clearCurrentUserId()

    return NextResponse.json(turnout, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error creating turnout:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
