'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface TurnoutNote {
  id: string
  timeReceived: string
  notes: string
  createdAt: string
  creator?: {
    firstName: string
    lastName: string
  }
}

interface Turnout {
  id: string
  accountNumber: string
  canal: string
  gate: string
  deliveredAcres: number
  acresOwned: number
  taxLotNumber: string
  legalDescription: string
  patron?: {
    firstName: string
    lastName: string
  }
  notes: TurnoutNote[]
}

export default function TurnoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [turnout, setTurnout] = useState<Turnout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    fetchTurnout()
  }, [params.id])

  const fetchTurnout = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/turnouts/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch turnout')
      }

      const data = await response.json()
      setTurnout(data)
    } catch (err) {
      setError('Error loading turnout')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setAddingNote(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/turnouts/${params.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: newNote }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      setNewNote('')
      fetchTurnout()
    } catch (err) {
      setError('Error adding note')
      console.error(err)
    } finally {
      setAddingNote(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this turnout?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/turnouts/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete turnout')
      }

      router.push('/admin/turnouts')
    } catch (err) {
      setError('Error deleting turnout')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!turnout) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Turnout not found
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/turnouts')}
              className="text-primary-600 hover:text-primary-900 mb-4 inline-block"
            >
              ← Back to Turnouts
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Turnout Details</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Patron</p>
                <p className="font-medium text-gray-900">
                  {turnout.patron?.firstName} {turnout.patron?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">{turnout.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Canal</p>
                <p className="font-medium text-gray-900">{turnout.canal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gate</p>
                <p className="font-medium text-gray-900">{turnout.gate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivered Acres</p>
                <p className="font-medium text-gray-900">{turnout.deliveredAcres.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Acres Owned</p>
                <p className="font-medium text-gray-900">{turnout.acresOwned.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax Lot Number</p>
                <p className="font-medium text-gray-900">{turnout.taxLotNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Legal Description</p>
                <p className="font-medium text-gray-900">{turnout.legalDescription || '-'}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.push(`/admin/turnouts/${turnout.id}/edit`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Edit Turnout
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Turnout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Turnout Notes</h2>

            <form onSubmit={handleAddNote} className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new note..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </form>

            {turnout.notes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              <div className="space-y-4">
                {turnout.notes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-500">
                        {new Date(note.timeReceived).toLocaleString()}
                      </p>
                      {note.creator && (
                        <p className="text-sm text-gray-600">
                          by {note.creator.firstName} {note.creator.lastName}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-900">{note.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
