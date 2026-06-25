'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'

export default function PatronsPage() {
  const router = useRouter()
  const [patrons, setPatrons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)

  const availableColumns = [
    { id: 'accountNumber', label: 'Account #' },
    { id: 'name', label: 'Name' },
    { id: 'legalName', label: 'Legal Name' },
    { id: 'primaryEmail', label: 'Email' },
    { id: 'primaryPhone', label: 'Phone' },
    { id: 'serviceStreet', label: 'Street' },
    { id: 'serviceCity', label: 'City' },
    { id: 'serviceState', label: 'State' },
    { id: 'serviceZip', label: 'Zip' },
    { id: 'totalWaterRightAcres', label: 'Water Right Acres' },
    { id: 'assessedAcres', label: 'Assessed Acres' },
    { id: 'isActive', label: 'Status' },
  ]

  useEffect(() => {
    fetchPatrons()
    fetchListViews()
  }, [])

  const fetchListViews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=patron', {
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

  const fetchPatrons = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/patrons', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patrons')
      }

      const data = await response.json()
      setPatrons(data)
    } catch (error) {
      console.error('Error fetching patrons:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (patrons: any[], filters: any[]) => {
    return patrons.filter((patron) => {
      return filters.every((filter) => {
        if (!filter.field || filter.value === '') return true
        // 'name' is a virtual field combining firstName + lastName
        const raw = filter.field === 'name'
          ? `${patron.firstName ?? ''} ${patron.lastName ?? ''}`.trim()
          : filter.field === 'isActive'
          ? (patron.isActive ? 'active' : 'inactive')
          : patron[filter.field] ?? ''
        const value = raw
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

  const filteredPatrons = (() => {
    let result = patrons

    // Apply saved view filters
    if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
      result = applyFilters(result, selectedView.filters)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (patron) =>
          (patron.accountNumber ?? '').toLowerCase().includes(term) ||
          (patron.firstName ?? '').toLowerCase().includes(term) ||
          (patron.lastName ?? '').toLowerCase().includes(term) ||
          (patron.primaryEmail ?? '').toLowerCase().includes(term) ||
          (patron.serviceStreet ?? '').toLowerCase().includes(term) ||
          (patron.serviceCity ?? '').toLowerCase().includes(term) ||
          (patron.serviceZip ?? '').toLowerCase().includes(term)
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
          entityType: 'patron',
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

  const renderColumnValue = (patron: any, columnId: string) => {
    switch (columnId) {
      case 'accountNumber':
        return patron.accountNumber
      case 'name':
        return (
          <Link
            href={`/admin/patrons/${patron.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            {patron.firstName} {patron.lastName}
          </Link>
        )
      case 'legalName':
        return patron.legalName || '-'
      case 'primaryEmail':
        return patron.primaryEmail
      case 'primaryPhone':
        return patron.primaryPhone
      case 'serviceStreet':
        return patron.serviceStreet || '-'
      case 'serviceCity':
        return patron.serviceCity || '-'
      case 'serviceState':
        return patron.serviceState || '-'
      case 'serviceZip':
        return patron.serviceZip || '-'
      case 'totalWaterRightAcres':
        return patron.totalWaterRightAcres
      case 'assessedAcres':
        return patron.assessedAcres
      case 'isActive':
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              patron.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {patron.isActive ? 'Active' : 'Inactive'}
          </span>
        )
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
          <h2 className="text-xl font-semibold text-gray-900">Patrons</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowListViewModal(true)}
              className="sf-btn sf-btn-secondary"
            >
              Create List View
            </button>
            <Link
              href="/admin/patrons/new"
              className="sf-btn sf-btn-primary"
            >
              + Add Patron
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
                  <option value="">All Patrons (Default View)</option>
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
                  placeholder="Search by account number, name, or email..."
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
                <p className="mt-2 text-gray-600">Loading patrons...</p>
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
                    {filteredPatrons.length === 0 ? (
                      <tr>
                        <td
                          colSpan={getVisibleColumns().length + 1}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No patrons found
                        </td>
                      </tr>
                    ) : (
                      filteredPatrons.map((patron) => (
                        <tr key={patron.id} className="hover:bg-gray-50">
                          {getVisibleColumns().map((columnId: string) => (
                            <td
                              key={columnId}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {renderColumnValue(patron, columnId)}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/patrons/${patron.id}/edit`}
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
        entityType="patron"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
      />
    </div>
  )
}
