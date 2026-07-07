import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { label, sortOrder } = await request.json()
    if (!label) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }

    const group = await prisma.navGroup.update({
      where: { id: params.id },
      data: { label, sortOrder: sortOrder ?? 0 },
      include: { links: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json(group)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    console.error('Error updating nav group:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.navGroup.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    console.error('Error deleting nav group:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
