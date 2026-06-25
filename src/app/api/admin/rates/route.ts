import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')

  const where: any = {}
  if (year) where.year = parseInt(year)

  const rates = await prisma.rate.findMany({
    where,
    include: { items: { include: { rateType: true } } },
    orderBy: { year: 'desc' },
  })

  return NextResponse.json(rates)
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { year } = body

    if (!year) {
      return NextResponse.json({ error: 'year is required' }, { status: 400 })
    }

    const rate = await prisma.rate.create({
      data: { year: parseInt(year) },
      include: { items: { include: { rateType: true } } },
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error: any) {
    console.error('Error creating rate:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
