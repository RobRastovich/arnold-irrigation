'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'

export default function WeirBooksPage() {
  const [weirBooks, setWeirBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)

  const availableColumns = [
    { id: 'weirLocation', label: 'Weir Location' },
    { id: 'canal', label: 'Canal' },
    { id: 'createdAt', label: 'Created' },
  ]

  useEffect(() => {
    fetchWeirBooks()
    fetchListViews()
  }, [])

  const fetchWeirBooks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/weir-books', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setWeirBooks(data)
      }
    } catch (err) {
      console.error('Error fetching weir books:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchListViews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=weirBook', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setListViews(data)
      }
    } catch (error) {
      console.error('Error fetching list views:', error)
    }
  }

  const applyFilters = (items: any[], filters: any[]) => {
    return items.filter((item) =>
      filters.every((filter) => {
        const value = item[filter.field]
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
    )
  }

  const filteredWeirBooks = (() => {
    let result = weirBooks.map((wb) => ({ ...wb, itemCount: wb.items?.length ?? 0 }))

    if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
      result = applyFilters(result, selectedView.filters)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (wb) =>
          wb.weirNumber.toLowerCase().includes(term) ||
          wb.canal.toLowerCase().includes(term) ||
          String(wb.weirLocation).includes(term)
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
          entityType: 'weirBook',
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
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        if (selectedView?.id === viewId) setSelectedView(null)
        await fetchListViews()
      }
    } catch (error) {
      console.error('Error deleting list view:', error)
    }
  }

  const getVisibleColumns = () => {
    if (selectedView && selectedView.columns) return selectedView.columns
    return availableColumns.map((col) => col.id)
  }

  const renderColumnValue = (wb: any, columnId: string) => {
    switch (columnId) {
      case 'weirLocation':
        return (
          <Link href={`/admin/weir-books/${wb.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
            {wb.weirLocation}
          </Link>
        )
      case 'canal':
        return wb.canal
      case 'createdAt':
        return new Date(wb.createdAt).toLocaleDateString()
      default:
        return '-'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Weir Books</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams()
                if (searchTerm) params.set('search', searchTerm)
                if (selectedView?.id) params.set('viewId', selectedView.id)
                window.open(`/admin/weir-books/print?${params.toString()}`, '_blank')
              }}
              className="sf-btn sf-btn-secondary"
            >
              🖨 Print
            </button>
            <button
              onClick={() => setShowListViewModal(true)}
              className="sf-btn sf-btn-secondary"
            >
              Create List View
            </button>
            <Link href="/admin/weir-books/new" className="sf-btn sf-btn-primary">
              + New Weir Book
            </Link>
          </div>
        </header>

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
                  <option value="">All Weir Books (Default View)</option>
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
                  placeholder="Search by canal or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="sf-input w-full"
                />
              </div>
            </div>

            {/* Hierarchical Weir Book + Items view */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading weir books...</p>
              </div>
            ) : filteredWeirBooks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No weir books found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patron</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Acres</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Private Acres</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Image</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredWeirBooks.map((wb) => (
                      <React.Fragment key={wb.id}>
                        {/* Weir Book header row */}
                        <tr className="bg-blue-50 border-t-2 border-blue-200">
                          <td className="px-4 py-2 text-sm font-bold">
                            <Link
                              href={`/admin/weir-books/${wb.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {wb.weirLocation}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-gray-800" colSpan={7}>
                            {wb.canal}
                            <span className="ml-3 text-xs font-normal text-gray-500">
                              {wb.items?.length === 0
                                ? 'No items'
                                : `${wb.items?.length} item${wb.items?.length !== 1 ? 's' : ''}`}
                            </span>
                          </td>
                        </tr>
                        {/* Item rows */}
                        {wb.items?.length === 0 ? (
                          <tr>
                            <td className="px-4 py-2 pl-10 text-xs text-gray-400 italic" colSpan={8}>
                              No items yet
                            </td>
                          </tr>
                        ) : (
                          <>
                            {wb.items.map((item: any) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 pl-10 text-xs text-gray-400">↳</td>
                                <td className="px-4 py-2 text-sm text-gray-600"></td>
                                <td className="px-4 py-2 text-sm">
                                  {item.patron ? (
                                    <Link
                                      href={`/admin/patrons/${item.patron.id}`}
                                      className="text-blue-600 hover:text-blue-900 text-xs"
                                    >
                                      {item.patron.firstName} {item.patron.lastName}
                                      <span className="text-gray-400 ml-1">({item.accountNumber})</span>
                                    </Link>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {item.acres != null ? item.acres.toFixed(2) : '—'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {item.privateAcres != null ? item.privateAcres.toFixed(2) : '—'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 max-w-xs">
                                  {item.description
                                    ? item.description.length > 80
                                      ? `${item.description.substring(0, 80)}…`
                                      : item.description
                                    : '—'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 max-w-xs">
                                  {item.notes
                                    ? item.notes.length > 80
                                      ? `${item.notes.substring(0, 80)}…`
                                      : item.notes
                                    : '—'}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {item.imageUrl ? (
                                    <a
                                      href={item.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-900 text-xs"
                                    >
                                      View
                                    </a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            ))}
                            {/* Subtotal row */}
                            <tr className="bg-blue-50 border-t border-blue-200">
                              <td className="px-4 py-2 pl-10 text-xs text-gray-400" colSpan={3}>
                                <span className="font-semibold text-gray-600">Subtotal</span>
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-blue-700">
                                {wb.items.reduce((sum: number, i: any) => sum + (i.acres ?? 0), 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-blue-700">
                                {wb.items.reduce((sum: number, i: any) => sum + (i.privateAcres ?? 0), 0).toFixed(2)}
                              </td>
                              <td colSpan={3}></td>
                            </tr>
                          </>
                        )}
                      </React.Fragment>
                    ))}
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
        entityType="weirBook"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
      />
    </div>
  )
}
