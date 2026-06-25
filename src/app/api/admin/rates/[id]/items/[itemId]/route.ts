import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rateTypeId, rateCode, chargeType, assessment } = await request.json()

    const item = await prisma.rateItem.update({
      where: { id: params.itemId },
      data: {
        rateTypeId,
        rateCode: rateCode?.slice(0, 10),
        chargeType,
        assessment,
      },
      include: { rateType: true },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('Error updating rate item:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.rateItem.delete({ where: { id: params.itemId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting rate item:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
