'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import AddTicketNoteModal from '@/components/AddTicketNoteModal'
import { formatDateTimeInTimezone } from '@/lib/date-utils'

export default function TicketDetailPage() {
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
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tickets"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              ← Back to Tickets
            </Link>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/tickets/${ticket.id}/edit`}
              className="sf-btn sf-btn-primary"
            >
              Edit Ticket
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Ticket Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">#{ticket.ticketNumber}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority} Priority
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(ticket.type)}`}>
                      {ticket.type.replace('_', ' ')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Created by {' '}
                    <span className="font-medium text-gray-700">
                      {ticket.createdByUser
                        ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
                        : 'Unknown'}
                    </span>
                    {' '}on {formatDateTimeInTimezone(ticket.createdAt, userTimezone)}
                    {' '}&middot; Updated {formatDateTimeInTimezone(ticket.updatedAt, userTimezone)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  {ticket.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                  ) : (
                    <p className="text-gray-400 italic">No description provided</p>
                  )}
                </div>
              </div>

              {/* Metadata Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</p>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</p>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(ticket.type)}`}>
                        {ticket.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {ticket.assignedToUser
                          ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`
                          : <span className="text-gray-400 italic">Unassigned</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTimeInTimezone(ticket.createdAt, userTimezone)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTimeInTimezone(ticket.updatedAt, userTimezone)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notes
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {ticket.notes?.length || 0}
                  </span>
                </h3>
                <button
                  className="sf-btn sf-btn-secondary text-xs"
                  onClick={() => setShowNoteModal(true)}
                >
                  + New Note
                </button>
              </div>

              {(ticket.notes?.length || 0) === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">No notes yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click "New Note" to add the first note</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticket.notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedNote(note)
                        setShowNoteDetailModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                              {note.creator
                                ? `${note.creator.firstName?.[0] ?? ''}${note.creator.lastName?.[0] ?? ''}`
                                : '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {note.creator
                                  ? `${note.creator.firstName} ${note.creator.lastName}`
                                  : 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTimeInTimezone(note.timeReceived, userTimezone)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                            {note.notes}
                          </p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-900 text-xs font-medium shrink-0">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
