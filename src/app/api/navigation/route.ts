import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
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
    console.error('Error fetching public navigation:', error)
    return NextResponse.json({ groups: [], topLevelLinks: [] })
  }
}
