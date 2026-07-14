import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

const schedulerTypes = ['THERMAL_SCAN', 'DITCH_SURVEY', 'WEIR_ANALYSIS', 'PATRON']
const schedulerStatuses = ['NEW_REQUEST', 'SCHEDULED', 'COMPLETED']

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const scheduler = await prisma.scheduler.findUnique({
      where: { id: params.id },
      include: { notes: { orderBy: { timeReceived: 'desc' } }, documents: { orderBy: { createdAt: 'desc' } } },
    })
    if (!scheduler) return NextResponse.json({ error: 'Scheduler activity not found' }, { status: 404 })

    const userIds = scheduler.notes.flatMap((note) => note.createdBy ? [note.createdBy] : [])
    const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } }) : []
    const userMap = new Map(users.map((item) => [item.id, item]))
    return NextResponse.json({ ...scheduler, notes: scheduler.notes.map((note) => ({ ...note, creator: note.createdBy ? userMap.get(note.createdBy) || null : null })) })
  } catch (error) {
    console.error('Error fetching scheduler activity:', error)
    return NextResponse.json({ error: 'Failed to fetch scheduler activity' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduledTime, type, status, description } = await request.json()
    if (!scheduledTime || !type || !status || !description?.trim()) {
      return NextResponse.json({ error: 'Scheduled time, type, status, and description are required' }, { status: 400 })
    }
    if (!schedulerTypes.includes(type) || !schedulerStatuses.includes(status) || description.length > 255 || Number.isNaN(new Date(scheduledTime).getTime())) {
      return NextResponse.json({ error: 'Invalid scheduler data' }, { status: 400 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)
    const scheduler = await prisma.scheduler.update({
      where: { id: params.id },
      data: { scheduledTime: new Date(scheduledTime), type, status, description: description.trim() },
    })
    clearCurrentUserId()
    return NextResponse.json(scheduler)
  } catch (error: any) {
    clearCurrentUserId()
    if (error.code === 'P2025') return NextResponse.json({ error: 'Scheduler activity not found' }, { status: 404 })
    console.error('Error updating scheduler activity:', error)
    return NextResponse.json({ error: error.message || 'Failed to update scheduler activity' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)
    await prisma.scheduler.delete({ where: { id: params.id } })
    clearCurrentUserId()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    clearCurrentUserId()
    if (error.code === 'P2025') return NextResponse.json({ error: 'Scheduler activity not found' }, { status: 404 })
    console.error('Error deleting scheduler activity:', error)
    return NextResponse.json({ error: 'Failed to delete scheduler activity' }, { status: 500 })
  }
}
