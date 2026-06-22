import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/s3'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { fileName, contentType } = body

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || 'bin'
    const key = `patrons/${params.id}/documents/${crypto.randomUUID()}.${ext}`

    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    const s3Url = getPublicUrl(key)

    return NextResponse.json({ uploadUrl, s3Url, key })
  } catch (error: any) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
