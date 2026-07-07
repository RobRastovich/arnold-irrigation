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

    const pages = await prisma.cmsPage.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(pages)
  } catch (error: any) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, status, metaTitle, metaDesc } = body

    if (!title || !slug || content === undefined) {
      return NextResponse.json({ error: 'title, slug, and content are required' }, { status: 400 })
    }

    const page = await prisma.cmsPage.create({
      data: {
        title,
        slug,
        content,
        status: status || 'DRAFT',
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        createdBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        updatedBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 })
    }
    console.error('Error creating page:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
