import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const page = await prisma.cmsPage.findUnique({ where: { id: params.id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Error fetching page:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const page = await prisma.cmsPage.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        content,
        status,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        updatedBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      },
    })

    return NextResponse.json(page)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }
    console.error('Error updating page:', error)
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

    await prisma.cmsPage.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }
    console.error('Error deleting page:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
