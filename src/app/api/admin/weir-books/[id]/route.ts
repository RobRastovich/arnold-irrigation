import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weirBook = await prisma.weirBook.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            patron: {
              select: { id: true, firstName: true, lastName: true, accountNumber: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    })

    if (!weirBook) {
      return NextResponse.json({ error: 'Weir book not found' }, { status: 404 })
    }

    return NextResponse.json(weirBook)
  } catch (error) {
    console.error('Error fetching weir book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { canal, weirLocation } = body

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const weirBook = await prisma.weirBook.update({
      where: { id: params.id },
      data: {
        ...(canal !== undefined && { canal }),
        ...(weirLocation !== undefined && { weirLocation: parseInt(weirLocation) }),
      },
      include: { items: true },
    })

    clearCurrentUserId()

    return NextResponse.json(weirBook)
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error updating weir book:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

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

    await prisma.weirBook.delete({ where: { id: params.id } })

    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error deleting weir book:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
