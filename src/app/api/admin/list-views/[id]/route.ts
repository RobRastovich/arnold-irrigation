import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET - Fetch a specific list view
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const view = await prisma.savedListView.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!view) {
      return NextResponse.json({ error: 'List view not found' }, { status: 404 })
    }

    return NextResponse.json(view)
  } catch (error) {
    console.error('Error fetching list view:', error)
    return NextResponse.json({ error: 'Failed to fetch list view' }, { status: 500 })
  }
}

// PUT - Update a list view
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, columns, filters, isDefault } = body

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    if (isDefault) {
      const existing = await prisma.savedListView.findFirst({ where: { id: params.id, userId: user.userId } })
      if (existing) {
        await prisma.savedListView.updateMany({
          where: { userId: user.userId, entityType: existing.entityType, isDefault: true, id: { not: params.id } },
          data: { isDefault: false },
        })
      }
    }

    const view = await prisma.savedListView.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(columns && { columns }),
        ...(filters !== undefined && { filters }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    clearCurrentUserId()

    return NextResponse.json(view)
  } catch (error) {
    console.error('Error updating list view:', error)
    clearCurrentUserId()
    return NextResponse.json({ error: 'Failed to update list view' }, { status: 500 })
  }
}

// DELETE - Delete a list view
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    await prisma.savedListView.delete({
      where: { id: params.id },
    })

    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting list view:', error)
    clearCurrentUserId()
    return NextResponse.json({ error: 'Failed to delete list view' }, { status: 500 })
  }
}
