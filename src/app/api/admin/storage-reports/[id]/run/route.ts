import { NextRequest, NextResponse } from 'next/server'
import { setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'
import { runAndSave } from '@/lib/storage-report/loadReport'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)
    const { result } = await runAndSave(params.id)
    clearCurrentUserId()
    return NextResponse.json(result)
  } catch (error: any) {
    clearCurrentUserId()
    console.error('Error running storage report:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
