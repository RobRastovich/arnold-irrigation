import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
import { authenticateRequest } from '@/lib/api-auth'

// GET all patrons
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patrons = await prisma.patron.findMany({
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        additionalContacts: true,
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(patrons)
  } catch (error) {
    console.error('Error fetching patrons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new patron
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email

  try {
    const body = await request.json()
    const {
      accountNumber,
      firstName,
      lastName,
      legalName,
      serviceStreet,
      serviceCity,
      serviceState,
      serviceZip,
      serviceCountry,
      mailingStreet,
      mailingCity,
      mailingState,
      mailingZip,
      mailingCountry,
      primaryEmail,
      primaryPhone,
      totalWaterRightAcres,
      assessedAcres,
    } = body

    // Check if account number already exists
    const existingPatron = await prisma.patron.findUnique({
      where: { accountNumber },
    })

    if (existingPatron) {
      return NextResponse.json({ error: 'Account number already exists' }, { status: 409 })
    }

    const patron = await prisma.patron.create({
      data: {
        accountNumber,
        firstName,
        lastName,
        legalName,
        serviceStreet,
        serviceCity,
        serviceState,
        serviceZip,
        serviceCountry: serviceCountry || 'US',
        mailingStreet,
        mailingCity,
        mailingState,
        mailingZip,
        mailingCountry,
        primaryEmail,
        primaryPhone,
        totalWaterRightAcres: parseFloat(totalWaterRightAcres),
        assessedAcres: parseFloat(assessedAcres),
      },
    })

    return NextResponse.json(patron, { status: 201 })
  } catch (error) {
    console.error('Error creating patron:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
