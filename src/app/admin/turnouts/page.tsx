'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'

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
    firstName: string
    lastName: string
  }
}

export default function TurnoutsPage() {
  const router = useRouter()
  const [turnouts, setTurnouts] = useState<Turnout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)

  const availableColumns = [
    { id: 'accountNumber', label: 'Account #' },
    { id: 'patronName', label: 'Patron' },
    { id: 'canalGate', label: 'Canal/Gate' },
    { id: 'deliveredAcres', label: 'Delivered Acres' },
    { id: 'acresOwned', label: 'Acres Owned' },
    { id: 'taxLotNumber', label: 'Tax Lot' },
    { id: 'legalDescription', label: 'Legal Description' },
  ]

  useEffect(() => {
    fetchTurnouts()
    fetchListViews()
  }, [])

  const fetchTurnouts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/turnouts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch turnouts')
      }

      const data = await response.json()
      setTurnouts(data)
    } catch (err) {
      setError('Error loading turnouts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchListViews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=turnout', {
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

  const applyFilters = (turnouts: any[], filters: any[]) => {
    return turnouts.filter((turnout) => {
      return filters.every((filter) => {
        if (!filter.field || filter.value === '') return true
        const value = turnout[filter.field] ?? ''
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

  const filteredTurnouts = (() => {
    let result = turnouts

    // Apply saved view filters
    if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
      result = applyFilters(result, selectedView.filters)
    }

    // Apply search term
    if (searchTerm) {
      result = result.filter(
        (turnout) =>
          turnout.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turnout.canal.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turnout.gate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (turnout.patron?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          (turnout.patron?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
          entityType: 'turnout',
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

  const renderColumnValue = (turnout: Turnout, columnId: string) => {
    switch (columnId) {
      case 'accountNumber':
        return turnout.accountNumber
      case 'patronName':
        return turnout.patron?.id ? (
          <Link
            href={`/admin/patrons/${turnout.patron.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            {turnout.patron.firstName} {turnout.patron.lastName}
          </Link>
        ) : (
          '-'
        )
      case 'canalGate':
        return (
          <Link
            href={`/admin/turnouts/${turnout.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            {turnout.canal} - {turnout.gate}
          </Link>
        )
      case 'deliveredAcres':
        return turnout.deliveredAcres.toFixed(2)
      case 'acresOwned':
        return turnout.acresOwned.toFixed(2)
      case 'taxLotNumber':
        return turnout.taxLotNumber || '-'
      case 'legalDescription':
        return turnout.legalDescription || '-'
      default:
        return '-'
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Turnouts</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowListViewModal(true)}
              className="sf-btn sf-btn-secondary"
            >
              Create List View
            </button>
            <Link
              href="/admin/turnouts/new"
              className="sf-btn sf-btn-primary"
            >
              + Add Turnout
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
                  <option value="">All Turnouts (Default View)</option>
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
                  placeholder="Search by account, canal, gate, or patron..."
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
                <p className="mt-2 text-gray-600">Loading turnouts...</p>
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
                    {filteredTurnouts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={getVisibleColumns().length + 1}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No turnouts found
                        </td>
                      </tr>
                    ) : (
                      filteredTurnouts.map((turnout) => (
                        <tr key={turnout.id} className="hover:bg-gray-50">
                          {getVisibleColumns().map((columnId: string) => (
                            <td
                              key={columnId}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {renderColumnValue(turnout, columnId)}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/turnouts/${turnout.id}/edit`}
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
        entityType="turnout"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
      />
    </div>
  )
}
