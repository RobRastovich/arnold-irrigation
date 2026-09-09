import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import { getUserFeatureKeys } from '@/lib/feature-access'

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const featureKeys = await getUserFeatureKeys(user.userId)
  return NextResponse.json({ featureKeys, role: user.role })
}
