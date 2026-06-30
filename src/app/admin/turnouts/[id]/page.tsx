'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'
import AddTurnoutNoteModal from '@/components/AddTurnoutNoteModal'

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
    id: string
    firstName?: string
    lastName?: string
    legalName?: string
    accountNumber?: string
  }
  notes: TurnoutNote[]
}

export default function TurnoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [turnout, setTurnout] = useState<Turnout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<TurnoutNote | null>(null)
  const [showNoteDetailModal, setShowNoteDetailModal] = useState(false)

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

  const handleNoteAdded = () => {
    fetchTurnout()
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
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Turnout Details</h2>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/admin/turnouts/${turnout.id}/edit`)}
              className="sf-btn sf-btn-primary"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="sf-btn bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="space-y-3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="sf-card">
              <div className="sf-card-header">Basic Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="sf-field-label">Patron</p>
                  {turnout.patron?.id ? (
                    <Link
                      href={`/admin/patrons/${turnout.patron.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {(turnout.patron.firstName || turnout.patron.lastName)
                        ? `${turnout.patron.firstName || ''} ${turnout.patron.lastName || ''}`.trim()
                        : turnout.patron.legalName || turnout.accountNumber}
                    </Link>
                  ) : (
                    <p className="sf-field-value">
                      {(turnout.patron?.firstName || turnout.patron?.lastName)
                        ? `${turnout.patron?.firstName || ''} ${turnout.patron?.lastName || ''}`.trim()
                        : turnout.patron?.legalName || turnout.accountNumber}
                    </p>
                  )}
                </div>
                <div>
                  <p className="sf-field-label">Account Number</p>
                  <p className="sf-field-value">{turnout.accountNumber}</p>
                </div>
                <div>
                  <p className="sf-field-label">Canal</p>
                  <p className="sf-field-value">{turnout.canal}</p>
                </div>
                <div>
                  <p className="sf-field-label">Gate</p>
                  <p className="sf-field-value">{turnout.gate}</p>
                </div>
                <div>
                  <p className="sf-field-label">Delivered Acres</p>
                  <p className="sf-field-value">{turnout.deliveredAcres.toFixed(2)}</p>
                </div>
                <div>
                  <p className="sf-field-label">Acres Owned</p>
                  <p className="sf-field-value">{turnout.acresOwned.toFixed(2)}</p>
                </div>
                <div>
                  <p className="sf-field-label">Tax Lot Number</p>
                  <p className="sf-field-value">{turnout.taxLotNumber || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="sf-field-label">Legal Description</p>
                  <p className="sf-field-value">{turnout.legalDescription || '-'}</p>
                </div>
              </div>
            </div>

            {/* Notes - Window Shade */}
            <WindowShade
              title={`Notes (${turnout.notes.length})`}
              defaultOpen={false}
              actionButton={
                <button
                  className="sf-btn sf-btn-secondary text-xs"
                  onClick={() => setShowNoteModal(true)}
                >
                  New Note
                </button>
              }
            >
              {turnout.notes.length === 0 ? (
                <p className="sf-field-value text-gray-500 text-center py-2">No notes yet</p>
              ) : (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Created By</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnout.notes.map((note) => (
                      <tr key={note.id}>
                        <td className="text-xs">
                          {new Date(note.timeReceived).toLocaleString()}
                        </td>
                        <td className="text-xs">
                          {note.creator ? (
                            `${note.creator.firstName} ${note.creator.lastName}`
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {note.notes.length > 100
                            ? `${note.notes.substring(0, 100)}...`
                            : note.notes}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedNote(note)
                              setShowNoteDetailModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </WindowShade>
          </div>
        </main>
      </div>

      <AddTurnoutNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        turnoutId={params.id as string}
        onNoteAdded={handleNoteAdded}
      />
      {showNoteDetailModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Note Details</h3>
                <button
                  onClick={() => setShowNoteDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedNote.timeReceived).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-sm text-gray-900">
                    {selectedNote.creator
                      ? `${selectedNote.creator.firstName} ${selectedNote.creator.lastName}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Note</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedNote.notes}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowNoteDetailModal(false)}
                  className="sf-btn sf-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
