import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'

const prisma = new PrismaClient()

// GET all tickets
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins and staff can view tickets
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden. Admin and Staff only.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const assignedTo = searchParams.get('assignedTo')
    const createdBy = searchParams.get('createdBy')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }
    if (assignedTo === 'me') {
      where.assignedTo = user.userId
    } else if (assignedTo) {
      where.assignedTo = assignedTo
    }
    if (createdBy === 'me') {
      where.createdBy = user.userId
    } else if (createdBy) {
      where.createdBy = createdBy
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Fetch user details for assignedTo and createdBy
    const userIds = new Set<string>()
    tickets.forEach((ticket: any) => {
      if (ticket.assignedTo) userIds.add(ticket.assignedTo)
      userIds.add(ticket.createdBy)
    })

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

    const ticketsWithUsers = tickets.map((ticket: any) => ({
      ...ticket,
      assignedToUser: ticket.assignedTo ? userMap.get(ticket.assignedTo) : null,
      createdByUser: userMap.get(ticket.createdBy),
    }))

    return NextResponse.json(ticketsWithUsers)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new ticket
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins and staff can create tickets
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden. Admin and Staff only.' }, { status: 403 })
  }


  try {
    const body = await request.json()
    const { title, description, type, priority, assignedTo } = body

    // Get the next ticket number
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    })

    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1001

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: nextTicketNumber,
        title,
        description,
        type,
        priority: priority || 'MEDIUM',
        assignedTo: assignedTo || null,
        createdBy: user.userId,
        status: 'NEW',
      },
    })

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
