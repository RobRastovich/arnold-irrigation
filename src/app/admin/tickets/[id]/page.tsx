'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'
import AddTicketNoteModal from '@/components/AddTicketNoteModal'
import { formatDateTimeInTimezone } from '@/lib/date-utils'

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userTimezone, setUserTimezone] = useState('America/Los_Angeles')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [showNoteDetailModal, setShowNoteDetailModal] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUserTimezone(parsedUser.timezone || 'America/Los_Angeles')
    }
  }, [])

  useEffect(() => {
    fetchTicket()
  }, [params.id])

  const handleNoteAdded = () => {
    fetchTicket()
  }

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/tickets/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch ticket')
      }

      const data = await response.json()
      setTicket(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'WAITING_APPROVAL':
        return 'bg-purple-100 text-purple-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FEATURE_REQUEST':
        return 'bg-green-100 text-green-800'
      case 'BUG_FIX':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/admin/tickets" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Tickets
          </Link>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ticket not found</p>
          <Link href="/admin/tickets" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Tickets
          </Link>
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
          <h2 className="text-xl font-semibold text-gray-900">Ticket #{ticket.ticketNumber}</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/tickets/${ticket.id}/edit`}
              className="sf-btn sf-btn-primary"
            >
              Edit
            </Link>
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
                <div className="md:col-span-3">
                  <p className="sf-field-label">Title</p>
                  <p className="sf-field-value">{ticket.title}</p>
                </div>
                <div>
                  <p className="sf-field-label">Type</p>
                  <p className="sf-field-value">{ticket.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="sf-field-label">Status</p>
                  <p className="sf-field-value">{ticket.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="sf-field-label">Priority</p>
                  <p className="sf-field-value">{ticket.priority}</p>
                </div>
                <div>
                  <p className="sf-field-label">Assigned To</p>
                  <p className="sf-field-value">
                    {ticket.assignedToUser
                      ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`
                      : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="sf-field-label">Created By</p>
                  <p className="sf-field-value">
                    {ticket.createdByUser
                      ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="sf-field-label">Created At</p>
                  <p className="sf-field-value">{formatDateTimeInTimezone(ticket.createdAt, userTimezone)}</p>
                </div>
                <div>
                  <p className="sf-field-label">Updated At</p>
                  <p className="sf-field-value">{formatDateTimeInTimezone(ticket.updatedAt, userTimezone)}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="sf-field-label">Description</p>
                  <p className="sf-field-value whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </div>

            {/* Notes - Window Shade */}
            <WindowShade
              title={`Notes (${ticket.notes?.length || 0})`}
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
              {(ticket.notes?.length || 0) === 0 ? (
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
                    {ticket.notes.map((note: any) => (
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

      <AddTicketNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        ticketId={params.id as string}
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
