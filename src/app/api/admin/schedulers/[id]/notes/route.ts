import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { notes } = await request.json()
    if (!notes?.trim()) return NextResponse.json({ error: 'Note is required' }, { status: 400 })

    const scheduler = await prisma.scheduler.findUnique({ where: { id: params.id }, select: { id: true } })
    if (!scheduler) return NextResponse.json({ error: 'Scheduler activity not found' }, { status: 404 })

    const existingUser = user.userId ? await prisma.user.findUnique({ where: { id: user.userId }, select: { id: true } }) : null
    const note = await prisma.note.create({ data: { schedulerId: params.id, notes: notes.trim(), createdBy: existingUser?.id || null } })
    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    console.error('Error creating scheduler note:', error)
    return NextResponse.json({ error: error.message || 'Failed to create scheduler note' }, { status: 500 })
  }
}
