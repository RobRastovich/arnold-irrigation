import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
import { authenticateRequest } from '@/lib/api-auth'

// GET all audit logs
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('tableName')
    const recordId = searchParams.get('recordId')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (tableName) where.tableName = tableName
    if (recordId) where.recordId = recordId

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE purge audit logs
export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can purge audit logs
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const beforeDate = searchParams.get('beforeDate')
    const tableName = searchParams.get('tableName')

    const where: any = {}
    if (beforeDate) {
      const date = new Date(beforeDate)
      where.createdAt = {
        lt: date,
      }
    }
    if (tableName) {
      where.tableName = tableName
    }

    // First, count how many records match
    const count = await prisma.auditLog.count({ where })

    const result = await prisma.auditLog.deleteMany({
      where,
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      matchedCount: count,
    })
  } catch (error) {
    console.error('Error purging audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
