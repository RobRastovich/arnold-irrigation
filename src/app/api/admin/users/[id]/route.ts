import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { hashPassword } from '@/lib/auth'

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can view user details
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
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

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can update users
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email

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
      isActive,
      emailVerified,
      timezone,
    } = body

    const updateData: any = {}
    if (email !== undefined) updateData.email = email
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zip !== undefined) updateData.zip = zip
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified
    if (timezone !== undefined) updateData.timezone = timezone
    if (password) {
      updateData.passwordHash = await hashPassword(password)
    }

    setCurrentUserId(user.userId, userName)

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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

    clearCurrentUserId()

    return NextResponse.json(updatedUser)
  } catch (error) {
    clearCurrentUserId()
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can delete users
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  // Prevent deleting yourself
  if (params.id === user.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email

  try {
    setCurrentUserId(user.userId, userName)
    await prisma.user.delete({
      where: { id: params.id },
    })
    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error) {
    clearCurrentUserId()
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
