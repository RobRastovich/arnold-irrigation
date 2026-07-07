import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.cmsPage.findFirst({
      where: {
        slug: params.slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        metaTitle: true,
        metaDesc: true,
        updatedAt: true,
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Error fetching public page:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
