import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET all notes for a patron
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const notes = await prisma.note.findMany({
      where: { patronId: params.id },
      orderBy: { timeReceived: 'desc' },
    })

    // Fetch creator names for notes that have createdBy
    const userIds = notes.filter((n: any) => n.createdBy).map((n: any) => n.createdBy).filter(Boolean) as string[]
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true }
    }) : []

    const userMap = new Map(users.map((u: any) => [u.id, u]))

    const notesWithCreators = notes.map((note: any) => ({
      ...note,
      creator: note.createdBy ? userMap.get(note.createdBy) : null
    }))

    return NextResponse.json(notesWithCreators)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { notes, timeReceived } = body

    // Verify patron exists
    const patron = await prisma.patron.findUnique({
      where: { id: params.id },
    })

    if (!patron) {
      return NextResponse.json({ error: 'Patron not found' }, { status: 404 })
    }

    // Verify user exists before setting createdBy
    let createdBy = null
    if (user.userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true }
      })
      createdBy = existingUser ? user.userId : null
    }

    const newNote = await prisma.note.create({
      data: {
        patronId: params.id,
        notes,
        createdBy,
        timeReceived: timeReceived ? new Date(timeReceived) : new Date(),
      },
    })

    return NextResponse.json(newNote, { status: 201 })
  } catch (error: any) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
