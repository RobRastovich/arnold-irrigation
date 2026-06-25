import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const rateId = searchParams.get('rateId')
  const status = searchParams.get('status')

  const where: any = {}
  if (rateId) where.rateId = rateId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { accountNumber: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      rate: { select: { year: true } },
    },
    orderBy: { invoiceNumber: 'desc' },
  })

  return NextResponse.json(invoices)
}
