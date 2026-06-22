'use client'

import { useRef, useState } from 'react'

const DOCUMENT_TYPES = [
  { value: 'INFO', label: 'Info' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'LEGAL', label: 'Legal' },
]

interface AddPatronDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  patronId: string
  onDocumentAdded: () => void
}

export default function AddPatronDocumentModal({
  isOpen,
  onClose,
  patronId,
  onDocumentAdded,
}: AddPatronDocumentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('INFO')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')

      // 1. Get presigned URL
      const presignRes = await fetch(`/api/admin/patrons/${patronId}/documents/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type }),
      })
      if (!presignRes.ok) {
        const d = await presignRes.json()
        throw new Error(d.error || 'Failed to get upload URL')
      }
      const { uploadUrl, s3Url, key } = await presignRes.json()

      // 2. Upload directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        mode: 'cors',
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file to S3')

      // 3. Save document record
      const saveRes = await fetch(`/api/admin/patrons/${patronId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType,
          fileName: selectedFile.name,
          s3Key: key,
          s3Url,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          description: description.trim() || null,
        }),
      })
      if (!saveRes.ok) {
        const d = await saveRes.json()
        throw new Error(d.error || 'Failed to save document')
      }

      onDocumentAdded()
      handleClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setDocumentType('INFO')
    setDescription('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-gray-300 rounded-lg p-1"
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-gray-500">
                {selectedFile.name} &nbsp;·&nbsp; {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="sf-btn sf-btn-secondary flex-1" disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="sf-btn sf-btn-primary flex-1" disabled={uploading}>
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Uploading…
                </span>
              ) : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
