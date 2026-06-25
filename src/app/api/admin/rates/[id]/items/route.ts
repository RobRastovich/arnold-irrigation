import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rateTypeId, rateCode, chargeType, assessment } = await request.json()

    if (!rateTypeId || !rateCode || !chargeType || assessment === undefined) {
      return NextResponse.json({ error: 'rateTypeId, rateCode, chargeType, and assessment are required' }, { status: 400 })
    }

    const item = await prisma.rateItem.create({
      data: {
        rateId: params.id,
        rateTypeId,
        rateCode: rateCode.slice(0, 10),
        chargeType,
        assessment,
      },
      include: { rateType: true },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('Error creating rate item:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
