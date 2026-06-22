'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { formatDateTimeInTimezone } from '@/lib/date-utils'

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userTimezone, setUserTimezone] = useState('America/Los_Angeles')

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
          </div>
        </main>
      </div>
    </div>
  )
}
