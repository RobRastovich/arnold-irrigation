import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
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
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !address || !city || !state || !zip || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
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
        role: 'PATRON', // Default role for self-registration
      },
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Return user data (excluding password) and token
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        user: userWithoutPassword,
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
