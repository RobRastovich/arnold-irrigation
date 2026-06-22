'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)

  const availableColumns = [
    { id: 'ticketNumber', label: '#' },
    { id: 'title', label: 'Title' },
    { id: 'type', label: 'Type' },
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'assignedTo', label: 'Assigned To' },
    { id: 'createdBy', label: 'Created By' },
  ]

  useEffect(() => {
    fetchTickets()
    fetchListViews()
  }, [])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/tickets', {
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

  const fetchListViews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=ticket', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setListViews(data)
      }
    } catch (error) {
      console.error('Error fetching list views:', error)
    }
  }

  const applyFilters = (tickets: any[], filters: any[]) => {
    return tickets.filter((ticket) => {
      return filters.every((filter) => {
        const value = ticket[filter.field]
        const filterValue = filter.value

        switch (filter.operator) {
          case 'equals':
            return String(value).toLowerCase() === filterValue.toLowerCase()
          case 'not_equals':
            return String(value).toLowerCase() !== filterValue.toLowerCase()
          case 'contains':
            return String(value).toLowerCase().includes(filterValue.toLowerCase())
          case 'not_contains':
            return !String(value).toLowerCase().includes(filterValue.toLowerCase())
          case 'greater_than':
            return Number(value) > Number(filterValue)
          case 'less_than':
            return Number(value) < Number(filterValue)
          case 'greater_equal':
            return Number(value) >= Number(filterValue)
          case 'less_equal':
            return Number(value) <= Number(filterValue)
          default:
            return true
        }
      })
    })
  }

  const filteredTickets = (() => {
    let result = tickets

    // Apply saved view filters
    if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
      result = applyFilters(result, selectedView.filters)
    }

    // Apply search term
    if (searchTerm) {
      result = result.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(ticket.ticketNumber).includes(searchTerm.toLowerCase())
      )
    }

    return result
  })()

  const handleSaveListView = async (view: { name: string; columns: string[]; filters: any[] }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: view.name,
          entityType: 'ticket',
          columns: view.columns,
          filters: view.filters,
        }),
      })

      if (response.ok) {
        await fetchListViews()
      }
    } catch (error) {
      console.error('Error saving list view:', error)
      throw error
    }
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Are you sure you want to delete this list view?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/list-views/${viewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        if (selectedView?.id === viewId) {
          setSelectedView(null)
        }
        await fetchListViews()
      }
    } catch (error) {
      console.error('Error deleting list view:', error)
    }
  }

  const getVisibleColumns = () => {
    if (selectedView && selectedView.columns) {
      return selectedView.columns
    }
    return availableColumns.map((col) => col.id)
  }

  const renderColumnValue = (ticket: any, columnId: string) => {
    switch (columnId) {
      case 'ticketNumber':
        return `#${ticket.ticketNumber}`
      case 'title':
        return (
          <Link
            href={`/admin/tickets/${ticket.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            {ticket.title}
          </Link>
        )
      case 'type':
        const typeColor: Record<string, string> = {
          FEATURE_REQUEST: 'bg-green-100 text-green-800',
          BUG_FIX: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColor[ticket.type] || 'bg-gray-100 text-gray-800'}`}>
            {ticket.type.replace('_', ' ')}
          </span>
        )
      case 'status':
        const statusColor: Record<string, string> = {
          NEW: 'bg-blue-100 text-blue-800',
          IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
          WAITING_APPROVAL: 'bg-purple-100 text-purple-800',
          CLOSED: 'bg-gray-100 text-gray-800',
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        )
      case 'priority':
        const priorityColor: Record<string, string> = {
          HIGH: 'bg-red-100 text-red-800',
          MEDIUM: 'bg-yellow-100 text-yellow-800',
          LOW: 'bg-green-100 text-green-800',
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColor[ticket.priority] || 'bg-gray-100 text-gray-800'}`}>
            {ticket.priority}
          </span>
        )
      case 'assignedTo':
        return ticket.assignedToUser
          ? `${ticket.assignedToUser.firstName} ${ticket.assignedToUser.lastName}`
          : 'Unassigned'
      case 'createdBy':
        return ticket.createdByUser
          ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`
          : 'Unknown'
      default:
        return '-'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowListViewModal(true)}
              className="sf-btn sf-btn-secondary"
            >
              Create List View
            </button>
            <Link
              href="/admin/tickets/new"
              className="sf-btn sf-btn-primary"
            >
              New Ticket
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* List View Selector & Search */}
            <div className="p-4 border-b border-gray-200 flex gap-4 items-center">
              <div className="flex-1">
                <select
                  value={selectedView?.id || ''}
                  onChange={(e) => {
                    const view = listViews.find((v) => v.id === e.target.value)
                    setSelectedView(view || null)
                  }}
                  className="sf-input w-full"
                >
                  <option value="">All Tickets (Default View)</option>
                  {listViews.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedView && (
                <button
                  onClick={() => handleDeleteView(selectedView.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete View
                </button>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by title or ticket number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="sf-input w-full"
                />
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
                      {getVisibleColumns().map((columnId: string) => {
                        const column = availableColumns.find((c) => c.id === columnId)
                        return (
                          <th
                            key={columnId}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column?.label}
                          </th>
                        )
                      })}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={getVisibleColumns().length + 1}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No tickets found
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          {getVisibleColumns().map((columnId: string) => (
                            <td
                              key={columnId}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {renderColumnValue(ticket, columnId)}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

      <ListViewModal
        isOpen={showListViewModal}
        onClose={() => setShowListViewModal(false)}
        entityType="ticket"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
      />
    </div>
  )
}
