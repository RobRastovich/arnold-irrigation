import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { ensureFeaturesSeeded } from '@/lib/feature-access'

export async function GET(request: NextRequest) {
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
        _count: { select: { users: true } },
      },
    })

    return NextResponse.json(
      features.map((feature) => ({
        ...feature,
        userCount: feature._count.users,
      }))
    )
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
  }
}
