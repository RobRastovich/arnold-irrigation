import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET - Fetch all list views for the current user
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')

    const where: any = { userId: user.userId }
    if (entityType) {
      where.entityType = entityType
    }

    const views = await prisma.savedListView.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(views)
  } catch (error) {
    console.error('Error fetching list views:', error)
    return NextResponse.json({ error: 'Failed to fetch list views' }, { status: 500 })
  }
}

// POST - Create a new list view
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, entityType, columns, filters, isDefault } = body

    if (!name || !entityType || !columns) {
      return NextResponse.json(
        { error: 'Name, entityType, and columns are required' },
        { status: 400 }
      )
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const view = await prisma.savedListView.create({
      data: {
        name,
        entityType,
        columns,
        filters: filters || [],
        userId: user.userId,
        isDefault: isDefault || false,
      },
    })

    clearCurrentUserId()

    return NextResponse.json(view, { status: 201 })
  } catch (error: any) {
    console.error('Error creating list view:', error)
    clearCurrentUserId()
    return NextResponse.json(
      { error: error.message || 'Failed to create list view' },
      { status: 500 }
    )
  }
}
