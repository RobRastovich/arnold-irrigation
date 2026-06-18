import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
import { authenticateRequest } from '@/lib/api-auth'

// GET single patron
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patron = await prisma.patron.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        additionalContacts: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!patron) {
      return NextResponse.json({ error: 'Patron not found' }, { status: 404 })
    }

    return NextResponse.json(patron)
  } catch (error) {
    console.error('Error fetching patron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update patron
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email

  try {
    const body = await request.json()
    const patron = await prisma.patron.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(patron)
  } catch (error) {
    console.error('Error updating patron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE patron
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.patron.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting patron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
