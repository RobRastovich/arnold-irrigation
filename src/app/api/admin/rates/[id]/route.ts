import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rate = await prisma.rate.findUnique({ where: { id: params.id } })
  if (!rate) return NextResponse.json({ error: 'Rate not found' }, { status: 404 })
  return NextResponse.json(rate)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      rateCode, year, ownerAccount, administrativeFee, capitalImprovement,
      construction, debtRetirement, interestCharge, maintenanceFee,
      operations, modernizationFund, releaseOfLienFee, taxLotFee, waterProtectionFund,
    } = body

    const rate = await prisma.rate.update({
      where: { id: params.id },
      data: {
        rateCode,
        year: year !== undefined ? parseInt(year) : undefined,
        ownerAccount,
        administrativeFee,
        capitalImprovement,
        construction,
        debtRetirement,
        interestCharge,
        maintenanceFee,
        operations,
        modernizationFund,
        releaseOfLienFee,
        taxLotFee,
        waterProtectionFund,
      },
    })

    return NextResponse.json(rate)
  } catch (error: any) {
    console.error('Error updating rate:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.rate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting rate:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
