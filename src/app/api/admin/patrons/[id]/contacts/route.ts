import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET all additional contacts for a patron
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contacts = await prisma.additionalContact.findMany({
      where: { patronId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new additional contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      mobilePhone,
      street,
      city,
      state,
      zip,
      country,
      contactType,
    } = body

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const contact = await prisma.additionalContact.create({
      data: {
        patronId: params.id,
        firstName,
        lastName,
        email,
        mobilePhone,
        street,
        city,
        state,
        zip,
        country,
        contactType: contactType || 'ADDITIONAL_CONTACT',
      },
    })

    clearCurrentUserId()

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    clearCurrentUserId()
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
