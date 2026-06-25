import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const year = searchParams.get('year')

  const where: any = {}
  if (search) {
    where.OR = [
      { rateCode: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (year) where.year = parseInt(year)

  const rates = await prisma.rate.findMany({
    where,
    orderBy: [{ year: 'desc' }, { rateCode: 'asc' }],
  })

  return NextResponse.json(rates)
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      rateCode, year, ownerAccount, administrativeFee, capitalImprovement,
      construction, debtRetirement, interestCharge, maintenanceFee,
      operations, modernizationFund, releaseOfLienFee, taxLotFee, waterProtectionFund,
    } = body

    if (!rateCode || !year) {
      return NextResponse.json({ error: 'rateCode and year are required' }, { status: 400 })
    }

    const rate = await prisma.rate.create({
      data: {
        rateCode,
        year: parseInt(year),
        ownerAccount: ownerAccount ?? 0,
        administrativeFee: administrativeFee ?? 0,
        capitalImprovement: capitalImprovement ?? 0,
        construction: construction ?? 0,
        debtRetirement: debtRetirement ?? 0,
        interestCharge: interestCharge ?? 0,
        maintenanceFee: maintenanceFee ?? 0,
        operations: operations ?? 0,
        modernizationFund: modernizationFund ?? 0,
        releaseOfLienFee: releaseOfLienFee ?? 0,
        taxLotFee: taxLotFee ?? 0,
        waterProtectionFund: waterProtectionFund ?? 0,
      },
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating rate:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
