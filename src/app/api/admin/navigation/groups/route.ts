import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { label, sortOrder } = await request.json()
    if (!label) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }

    const group = await prisma.navGroup.create({
      data: { label, sortOrder: sortOrder ?? 0 },
      include: { links: true },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    console.error('Error creating nav group:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
