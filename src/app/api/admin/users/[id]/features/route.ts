import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { ensureFeaturesSeeded, replaceUserFeatures } from '@/lib/feature-access'

export async function GET(
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
    await ensureFeaturesSeeded()
    const features = await prisma.feature.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        users: {
          where: { userId: params.id },
          select: { id: true },
        },
      },
    })

    return NextResponse.json(
      features.map((feature) => ({
        id: feature.id,
        key: feature.key,
        name: feature.name,
        href: feature.href,
        icon: feature.icon,
        enabled: feature.users.length > 0,
      }))
    )
  } catch (error) {
    console.error('Error fetching user features:', error)
    return NextResponse.json({ error: 'Failed to fetch user features' }, { status: 500 })
  }
}

export async function PUT(
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
    const { featureIds } = await request.json()
    if (!Array.isArray(featureIds)) {
      return NextResponse.json({ error: 'featureIds must be an array' }, { status: 400 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)
    await replaceUserFeatures(params.id, featureIds)
    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error updating user features:', error)
    return NextResponse.json({ error: error.message || 'Failed to update features' }, { status: 500 })
  }
}
