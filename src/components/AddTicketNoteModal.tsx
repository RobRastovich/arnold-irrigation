'use client'

import { useState } from 'react'

interface AddTicketNoteModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  onNoteAdded: () => void
}

export default function AddTicketNoteModal({ isOpen, onClose, ticketId, onNoteAdded }: AddTicketNoteModalProps) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: note,
          timeReceived: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create note')
      }

      onNoteAdded()
      onClose()
      setNote('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note *
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
                required
                className="sf-input w-full"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sf-btn sf-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !note.trim()}
                className="flex-1 sf-btn sf-btn-primary"
              >
                {submitting ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
