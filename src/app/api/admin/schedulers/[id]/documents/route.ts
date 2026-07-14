import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { documentType, fileName, s3Key, s3Url, mimeType, fileSize, description } = await request.json()
    if (!fileName || !s3Key || !s3Url || !mimeType) {
      return NextResponse.json({ error: 'fileName, s3Key, s3Url, and mimeType are required' }, { status: 400 })
    }

    const uploadedBy = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    const document = await prisma.schedulerDocument.create({
      data: { schedulerId: params.id, documentType: documentType || 'INFO', fileName, s3Key, s3Url, mimeType, fileSize: fileSize || 0, description: description || null, uploadedBy, uploadedById: user.userId },
    })
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating scheduler document:', error)
    return NextResponse.json({ error: 'Failed to create scheduler document' }, { status: 500 })
  }
}
