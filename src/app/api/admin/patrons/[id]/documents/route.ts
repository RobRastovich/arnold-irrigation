import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
import { authenticateRequest } from '@/lib/api-auth'

// GET all documents for a patron
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

// POST upload document (metadata only - actual upload would need separate endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      fileName,
      s3Key,
      mimeType,
      fileSize,
    } = body

    const document = await prisma.patronDocument.create({
      data: {
        patronId: params.id,
        fileName,
        s3Key,
        mimeType,
        fileSize,
        uploadedBy: user.userId,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
