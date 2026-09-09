import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  try {
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    await prisma.userFeature.deleteMany({
      where: {
        featureId: params.id,
        userId: params.userId,
      },
    })

    clearCurrentUserId()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error removing feature:', error)
    return NextResponse.json({ error: error.message || 'Failed to remove feature' }, { status: 500 })
  }
}
