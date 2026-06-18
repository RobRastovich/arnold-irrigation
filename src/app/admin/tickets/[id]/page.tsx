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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">Ticket #{ticket.ticketNumber}</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/tickets/${ticket.id}/edit`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex-shrink-0"
            >
              Edit Ticket
            </Link>
            <Link
              href="/admin/tickets"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex-shrink-0"
            >
              Back to Tickets
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Ticket Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
                  <p className="text-gray-600">#{ticket.ticketNumber}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(ticket.type)}`}
                  >
                    {ticket.type.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ticket.status)}`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(ticket.priority)}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>

              {/* Ticket Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900">{ticket.type.replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900">{ticket.status.replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Priority</dt>
                      <dd className="text-sm text-gray-900">{ticket.priority}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                      <dd className="text-sm text-gray-900">
                        {ticket.assignedToUser
                          ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`
                          : 'Unassigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created By</dt>
                      <dd className="text-sm text-gray-900">
                        {ticket.createdByUser
                          ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
                          : 'Unknown'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Timestamps */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created At</dt>
                      <dd className="text-sm text-gray-900">
                        {formatDateTimeInTimezone(ticket.createdAt, userTimezone)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                      <dd className="text-sm text-gray-900">
                        {formatDateTimeInTimezone(ticket.updatedAt, userTimezone)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Description */}
                <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
