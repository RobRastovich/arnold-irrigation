import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

const schedulerTypes = ['THERMAL_SCAN', 'DITCH_SURVEY', 'WEIR_ANALYSIS', 'PATRON']
const schedulerStatuses = ['NEW_REQUEST', 'SCHEDULED', 'COMPLETED']

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const schedulers = await prisma.scheduler.findMany({
      orderBy: { scheduledTime: 'asc' },
    })
    return NextResponse.json(schedulers)
  } catch (error) {
    console.error('Error fetching scheduler activities:', error)
    return NextResponse.json({ error: 'Failed to fetch scheduler activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduledTime, type, status, description } = await request.json()

    if (!scheduledTime || !type || !description?.trim()) {
      return NextResponse.json({ error: 'Scheduled time, type, and description are required' }, { status: 400 })
    }
    if (!schedulerTypes.includes(type) || !schedulerStatuses.includes(status || 'NEW_REQUEST')) {
      return NextResponse.json({ error: 'Invalid scheduler type or status' }, { status: 400 })
    }
    if (description.length > 255 || Number.isNaN(new Date(scheduledTime).getTime())) {
      return NextResponse.json({ error: 'Description must be 255 characters or fewer and scheduled time must be valid' }, { status: 400 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)
    const scheduler = await prisma.scheduler.create({
      data: { scheduledTime: new Date(scheduledTime), type, status: status || 'NEW_REQUEST', description: description.trim() },
    })
    clearCurrentUserId()
    return NextResponse.json(scheduler, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error creating scheduler activity:', error)
    return NextResponse.json({ error: error.message || 'Failed to create scheduler activity' }, { status: 500 })
  }
}
