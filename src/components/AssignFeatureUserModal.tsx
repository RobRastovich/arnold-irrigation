'use client'

import { useEffect, useState } from 'react'

interface AssignFeatureUserModalProps {
  isOpen: boolean
  onClose: () => void
  featureId: string
  featureKey: string
  assignedUserIds: string[]
  onUserAdded: () => void
}

export default function AssignFeatureUserModal({
  isOpen,
  onClose,
  featureId,
  featureKey,
  assignedUserIds,
  onUserAdded,
}: AssignFeatureUserModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setUserId('')
    setError('')
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to load users')
        const data = await response.json()
        setUsers(data)
      } catch (err: any) {
        setError(err.message)
      }
    }
    loadUsers()
  }, [isOpen])

  const availableUsers = users.filter((user) => {
    if (assignedUserIds.includes(user.id)) return false
    if (featureKey === 'users' && user.role !== 'ADMIN') return false
    return user.role === 'ADMIN' || user.role === 'STAFF'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/features/${featureId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to assign user')
      }

      onUserAdded()
      onClose()
      setUserId('')
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign User</h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User *
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="sf-input w-full"
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
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
                disabled={submitting || !userId}
                className="flex-1 sf-btn sf-btn-primary"
              >
                {submitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
