'use client'

import { useRef, useState } from 'react'

interface AddSchedulerDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  schedulerId: string
  onDocumentAdded: () => void
}

export default function AddSchedulerDocumentModal({ isOpen, onClose, schedulerId, onDocumentAdded }: AddSchedulerDocumentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('INFO')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setSelectedFile(null)
    setDocumentType('INFO')
    setDescription('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile) return setError('Please select a file to upload')
    setUploading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      const presignResponse = await fetch(`/api/admin/schedulers/${schedulerId}/documents/presign`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type }) })
      if (!presignResponse.ok) throw new Error((await presignResponse.json()).error || 'Failed to get upload URL')
      const { uploadUrl, s3Url, key } = await presignResponse.json()
      const uploadResponse = await fetch(uploadUrl, { method: 'PUT', body: selectedFile, mode: 'cors' })
      if (!uploadResponse.ok) throw new Error('Failed to upload file to S3')
      const saveResponse = await fetch(`/api/admin/schedulers/${schedulerId}/documents`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ documentType, fileName: selectedFile.name, s3Key: key, s3Url, mimeType: selectedFile.type, fileSize: selectedFile.size, description: description.trim() || null }) })
      if (!saveResponse.ok) throw new Error((await saveResponse.json()).error || 'Failed to save document')
      onDocumentAdded()
      handleClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="sf-input w-full"><option value="INFO">Info</option><option value="COMPLIANCE">Compliance</option><option value="LEGAL">Legal</option></select>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="w-full text-sm" required />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Optional description..." className="sf-input w-full" />
          <div className="flex gap-4"><button type="button" onClick={handleClose} disabled={uploading} className="flex-1 sf-btn sf-btn-secondary">Cancel</button><button type="submit" disabled={uploading} className="flex-1 sf-btn sf-btn-primary">{uploading ? 'Uploading...' : 'Upload'}</button></div>
        </form>
      </div>
    </div>
  )
}
