import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountNumber, acres, privateAcres, description, notes, imageUrl } = body

    if (!accountNumber && !description) {
      return NextResponse.json({ error: 'Either a patron or a description is required' }, { status: 400 })
    }

    const weirBook = await prisma.weirBook.findUnique({ where: { id: params.id } })
    if (!weirBook) {
      return NextResponse.json({ error: 'Weir book not found' }, { status: 404 })
    }

    if (accountNumber) {
      const patron = await prisma.patron.findUnique({ where: { accountNumber } })
      if (!patron) {
        return NextResponse.json({ error: 'Patron not found' }, { status: 404 })
      }
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const item = await prisma.weirBookItem.create({
      data: {
        weirBookId: params.id,
        accountNumber: accountNumber || null,
        acres: acres !== undefined && acres !== '' ? parseFloat(acres) : 0,
        privateAcres: privateAcres !== undefined && privateAcres !== '' ? parseFloat(privateAcres) : 0,
        description: description || null,
        notes: notes || null,
        imageUrl: imageUrl || null,
      },
      include: {
        patron: {
          select: { id: true, firstName: true, lastName: true, accountNumber: true },
        },
      },
    })

    clearCurrentUserId()

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error creating weir book item:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
