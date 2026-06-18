'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, typeFilter, assignedFilter])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      if (assignedFilter) params.append('assignedTo', assignedFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchTickets()
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
          <Link
            href="/admin/tickets/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex-shrink-0"
          >
            New Ticket
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_APPROVAL">Waiting Approval</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="BUG_FIX">Bug Fix</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={assignedFilter}
                    onChange={(e) => setAssignedFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Assignments</option>
                    <option value="me">Assigned to Me</option>
                  </select>
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading tickets...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No tickets found
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{ticket.ticketNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ticket.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(ticket.type)}`}
                            >
                              {ticket.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}
                            >
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ticket.assignedToUser
                              ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`
                              : 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ticket.createdByUser
                              ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
                              : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link
                              href={`/admin/tickets/${ticket.id}`}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/tickets/${ticket.id}/edit`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
