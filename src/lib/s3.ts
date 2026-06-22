import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export const S3_BUCKET = process.env.APP_AWS_S3_BUCKET || 'arnold-irrigation'

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  // Sign only the host header — browser sets Content-Type itself on the PUT
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
    signableHeaders: new Set(['host']),
  })
  console.log('[presign] uploadUrl:', url)
  return url
}

export function getPublicUrl(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.APP_AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`
}
