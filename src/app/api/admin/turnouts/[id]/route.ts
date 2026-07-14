import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET single turnout
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const turnout = await prisma.turnout.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: { timeReceived: 'desc' },
        },
        patron: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            legalName: true,
            accountNumber: true,
          },
        },
      },
    })

    if (!turnout) {
      return NextResponse.json({ error: 'Turnout not found' }, { status: 404 })
    }

    // Fetch creator names for notes that have createdBy
    const userIds = turnout.notes.filter((n: any) => n.createdBy).map((n: any) => n.createdBy).filter(Boolean) as string[]
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true }
    }) : []

    const userMap = new Map(users.map((u: any) => [u.id, u]))

    // Look up associated WeirBook by composite key "CANAL-GATE" (how weirNumber is stored)
    const weirBook = turnout.gate
      ? await prisma.weirBook.findUnique({
          where: {
            weirNumber: `${turnout.canal}-${turnout.gate}`,
          },
          select: {
            id: true,
            weirNumber: true,
            canal: true,
            weirLocation: true,
          },
        })
      : null

    const turnoutWithCreators = {
      ...turnout,
      weirBook,
      notes: turnout.notes.map((note: any) => ({
        ...note,
        creator: note.createdBy ? userMap.get(note.createdBy) : null
      }))
    }

    return NextResponse.json(turnoutWithCreators)
  } catch (error) {
    console.error('Error fetching turnout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update turnout
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      canal,
      gate,
      deliveredAcres,
      acresOwned,
      taxLotNumber,
      legalDescription,
    } = body

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const turnout = await prisma.turnout.update({
      where: { id: params.id },
      data: {
        canal,
        gate,
        deliveredAcres: deliveredAcres !== undefined ? parseFloat(deliveredAcres) : undefined,
        acresOwned: acresOwned !== undefined ? parseFloat(acresOwned) : undefined,
        taxLotNumber,
        legalDescription,
      },
      include: {
        notes: true,
        patron: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            legalName: true,
            accountNumber: true,
          },
        },
      },
    })

    clearCurrentUserId()

    return NextResponse.json(turnout)
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error updating turnout:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE turnout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    await prisma.turnout.delete({
      where: { id: params.id },
    })

    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error) {
    clearCurrentUserId()
    console.error('Error deleting turnout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
