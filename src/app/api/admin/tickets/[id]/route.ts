import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins and staff can view tickets
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden. Admin and Staff only.' }, { status: 403 })
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Fetch user details
    const userIds = new Set<string>()
    if (ticket.assignedTo) userIds.add(ticket.assignedTo)
    userIds.add(ticket.createdBy)

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    const userMap = new Map(users.map((u: any) => [u.id, u]))

    const ticketWithUsers = {
      ...ticket,
      assignedToUser: ticket.assignedTo ? userMap.get(ticket.assignedTo) : null,
      createdByUser: userMap.get(ticket.createdBy),
    }

    return NextResponse.json(ticketWithUsers)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins and staff can update tickets
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden. Admin and Staff only.' }, { status: 403 })
  }

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
  setCurrentUserId(user.userId, userName)

  try {
    const body = await request.json()
    const { title, description, type, status, priority, assignedTo } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    clearCurrentUserId()
  }
}

// DELETE ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can delete tickets
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
  setCurrentUserId(user.userId, userName)

  try {
    await prisma.ticket.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    clearCurrentUserId()
  }
}
