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

    const { label, url, groupId, sortOrder, openInNew } = await request.json()
    if (!label || !url) {
      return NextResponse.json({ error: 'label and url are required' }, { status: 400 })
    }

    const link = await prisma.navLink.create({
      data: {
        label,
        url,
        groupId: groupId || null,
        sortOrder: sortOrder ?? 0,
        openInNew: openInNew ?? false,
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error: any) {
    console.error('Error creating nav link:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
