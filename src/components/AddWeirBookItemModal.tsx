'use client'

import { useState, useEffect } from 'react'

interface Patron {
  id: string
  accountNumber: string
  firstName: string
  lastName: string
}

interface AddWeirBookItemModalProps {
  isOpen: boolean
  onClose: () => void
  weirBookId: string
  onItemAdded: () => void
}

export default function AddWeirBookItemModal({
  isOpen,
  onClose,
  weirBookId,
  onItemAdded,
}: AddWeirBookItemModalProps) {
  const [patrons, setPatrons] = useState<Patron[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    accountNumber: '',
    acres: '',
    privateAcres: '',
    description: '',
    notes: '',
    imageUrl: '',
  })

  useEffect(() => {
    if (isOpen) fetchPatrons()
  }, [isOpen])

  const fetchPatrons = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/patrons', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPatrons(data)
      }
    } catch (err) {
      console.error('Error fetching patrons:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!formData.accountNumber && !formData.description) {
      setError('Either a Patron or a Description is required')
      setSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/weir-books/${weirBookId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create item')
      }

      onItemAdded()
      onClose()
      setFormData({ accountNumber: '', acres: '', privateAcres: '', description: '', notes: '', imageUrl: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Weir Book Item</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patron</label>
              <select
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a patron</option>
                {patrons.map((p) => (
                  <option key={p.accountNumber} value={p.accountNumber}>
                    {p.firstName} {p.lastName} ({p.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acres</label>
                <input
                  type="number"
                  name="acres"
                  step="0.01"
                  value={formData.acres}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Private Acres</label>
                <input
                  type="number"
                  name="privateAcres"
                  step="0.01"
                  value={formData.privateAcres}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (S3)</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
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
                disabled={submitting}
                className="flex-1 sf-btn sf-btn-primary"
              >
                {submitting ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
