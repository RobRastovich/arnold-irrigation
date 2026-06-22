import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weirBooks = await prisma.weirBook.findMany({
      include: {
        items: {
          include: {
            patron: {
              select: { id: true, firstName: true, lastName: true, accountNumber: true },
            },
          },
        },
      },
      orderBy: { weirLocation: 'asc' },
    })

    return NextResponse.json(weirBooks)
  } catch (error) {
    console.error('Error fetching weir books:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { canal, weirLocation } = body

    if (!canal || weirLocation === undefined || weirLocation === '') {
      return NextResponse.json({ error: 'Canal and weir location are required' }, { status: 400 })
    }

    // Auto-increment weir number in 0001 format
    const last = await prisma.weirBook.findFirst({ orderBy: { weirNumber: 'desc' } })
    const nextNumber = last
      ? String(parseInt(last.weirNumber, 10) + 1).padStart(4, '0')
      : '0001'

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const weirBook = await prisma.weirBook.create({
      data: {
        weirNumber: nextNumber,
        canal,
        weirLocation: parseInt(weirLocation),
      },
      include: { items: true },
    })

    clearCurrentUserId()

    return NextResponse.json(weirBook, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error creating weir book:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
