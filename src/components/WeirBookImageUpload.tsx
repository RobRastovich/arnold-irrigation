'use client'

import { useRef, useState } from 'react'

interface WeirBookImageUploadProps {
  weirBookId: string
  itemId: string
  currentImageUrl?: string | null
  onUploaded: (imageUrl: string) => void
}

export default function WeirBookImageUpload({
  weirBookId,
  itemId,
  currentImageUrl,
  onUploaded,
}: WeirBookImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const token = localStorage.getItem('token')

      // 1. Get presigned URL from API
      const presignRes = await fetch(`/api/admin/weir-books/${weirBookId}/items/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      })

      if (!presignRes.ok) {
        const data = await presignRes.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await presignRes.json()

      // 2. Upload directly to S3
      // No extra headers — presigned URL signs only 'host', any additional
      // headers not in X-Amz-SignedHeaders will cause a 403 signature mismatch
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        mode: 'cors',
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload to S3')
      }

      // 3. Save the public URL back to the item
      const patchRes = await fetch(`/api/admin/weir-books/${weirBookId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: publicUrl }),
      })

      if (!patchRes.ok) {
        throw new Error('Failed to save image URL')
      }

      // 4. Show local preview immediately
      setPreview(URL.createObjectURL(file))
      onUploaded(publicUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {/* Hidden file input — accept images, also allows camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={undefined}
        onChange={handleFileChange}
        className="hidden"
        id={`img-upload-${itemId}`}
      />

      {preview ? (
        <div className="space-y-2">
          <img
            src={preview}
            alt="Weir book item"
            className="max-h-40 rounded border border-gray-200 object-contain"
          />
          <div className="flex gap-2">
            <label
              htmlFor={`img-upload-${itemId}`}
              className={`sf-btn sf-btn-secondary text-xs cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? 'Uploading…' : 'Replace Image'}
            </label>
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-btn sf-btn-secondary text-xs"
            >
              View Full Size
            </a>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`img-upload-${itemId}`}
          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-xs text-gray-500">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">📷</span>
              <span className="text-xs font-medium text-gray-600">Click to upload or take photo</span>
              <span className="text-xs text-gray-400">PNG, JPG, HEIC up to 10MB</span>
            </div>
          )}
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
