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

    const { label, url, groupId, sortOrder, openInNew } = await request.json()
    if (!label || !url) {
      return NextResponse.json({ error: 'label and url are required' }, { status: 400 })
    }

    const link = await prisma.navLink.update({
      where: { id: params.id },
      data: {
        label,
        url,
        groupId: groupId || null,
        sortOrder: sortOrder ?? 0,
        openInNew: openInNew ?? false,
      },
    })

    return NextResponse.json(link)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    console.error('Error updating nav link:', error)
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

    await prisma.navLink.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }
    console.error('Error deleting nav link:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
