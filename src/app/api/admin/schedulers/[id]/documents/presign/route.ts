import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/s3'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileName, contentType } = await request.json()
    if (!fileName || !contentType) return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })

    const ext = fileName.split('.').pop()?.toLowerCase() || 'bin'
    const key = `schedulers/${params.id}/documents/${crypto.randomUUID()}.${ext}`
    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, s3Url: getPublicUrl(key), key })
  } catch (error: any) {
    console.error('Error generating scheduler document upload URL:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate upload URL' }, { status: 500 })
  }
}
