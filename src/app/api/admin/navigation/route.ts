import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groups = await prisma.navGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        links: { orderBy: { sortOrder: 'asc' } },
      },
    })

    const topLevelLinks = await prisma.navLink.findMany({
      where: { groupId: null },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ groups, topLevelLinks })
  } catch (error: any) {
    console.error('Error fetching navigation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
