import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
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
    if (body.primaryEmail === '') {
      body.primaryEmail = undefined
    }
    if (body.primaryPhone === '') {
      body.primaryPhone = undefined
    }

    const cleanFirstName = body.firstName?.trim() || undefined
    const cleanLastName = body.lastName?.trim() || undefined
    const cleanLegalName = body.legalName?.trim() || undefined

    if (cleanFirstName !== undefined) body.firstName = cleanFirstName
    if (cleanLastName !== undefined) body.lastName = cleanLastName
    if (cleanLegalName !== undefined) body.legalName = cleanLegalName

    const hasLegalName = !!cleanLegalName
    const hasFirstLast = !!cleanFirstName && !!cleanLastName
    if (!hasLegalName && !hasFirstLast) {
      return NextResponse.json(
        { error: 'Please provide either a Legal Name or both First Name and Last Name.' },
        { status: 400 }
      )
    }

    setCurrentUserId(user.userId, userName)
    const patron = await prisma.patron.update({
      where: { id: params.id },
      data: body,
    })
    clearCurrentUserId()

    return NextResponse.json(patron)
  } catch (error) {
    clearCurrentUserId()
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

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email

  try {
    setCurrentUserId(user.userId, userName)
    await prisma.patron.delete({
      where: { id: params.id },
    })
    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error) {
    clearCurrentUserId()
    console.error('Error deleting patron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
