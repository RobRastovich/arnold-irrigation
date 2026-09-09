import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const feature = await prisma.feature.findUnique({ where: { id: params.id } })
    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (feature.key === 'users' && targetUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Users can only be assigned to administrators' }, { status: 400 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const assignment = await prisma.userFeature.upsert({
      where: {
        userId_featureId: { userId, featureId: params.id },
      },
      update: {},
      create: { userId, featureId: params.id },
    })

    clearCurrentUserId()
    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error assigning feature:', error)
    return NextResponse.json({ error: error.message || 'Failed to assign feature' }, { status: 500 })
  }
}
