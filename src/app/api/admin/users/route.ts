import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { hashPassword } from '@/lib/auth'

// GET all users
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can view all users
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const where: any = {}
    if (role) {
      where.role = role
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can create users
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  setCurrentUserId(user.userId, `${user.firstName} ${user.lastName}`)

  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      address,
      city,
      state,
      zip,
      phone,
      role,
      timezone,
    } = body

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        address,
        city,
        state,
        zip,
        phone,
        role: role || 'PATRON',
        timezone: timezone || 'America/Los_Angeles',
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    clearCurrentUserId()
  }
}
