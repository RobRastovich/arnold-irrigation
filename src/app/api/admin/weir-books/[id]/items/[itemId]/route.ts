import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, acres, privateAcres, description, notes, accountNumber } = body

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const item = await prisma.weirBookItem.update({
      where: { id: params.itemId },
      data: {
        ...(imageUrl !== undefined && { imageUrl }),
        ...(acres !== undefined && { acres: parseFloat(acres) }),
        ...(privateAcres !== undefined && { privateAcres: parseFloat(privateAcres) }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(accountNumber !== undefined && { accountNumber: accountNumber || null }),
      },
      include: {
        patron: {
          select: { id: true, firstName: true, lastName: true, accountNumber: true },
        },
      },
    })

    clearCurrentUserId()
    return NextResponse.json(item)
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error updating weir book item:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    await prisma.weirBookItem.delete({ where: { id: params.itemId } })

    clearCurrentUserId()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error deleting weir book item:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
