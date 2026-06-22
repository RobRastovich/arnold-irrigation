import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const documents = await prisma.patronDocument.findMany({
      where: { patronId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { documentType, fileName, s3Key, s3Url, mimeType, fileSize, description } = body

    if (!fileName || !s3Key || !s3Url || !mimeType) {
      return NextResponse.json({ error: 'fileName, s3Key, s3Url, and mimeType are required' }, { status: 400 })
    }

    const uploadedBy = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email

    const document = await prisma.patronDocument.create({
      data: {
        patronId: params.id,
        documentType: documentType || 'INFO',
        fileName,
        s3Key,
        s3Url,
        mimeType,
        fileSize: fileSize || 0,
        description: description || null,
        uploadedBy,
        uploadedById: user.userId,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
