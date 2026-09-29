'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'
import { sortItems, nextSortConfig, SortConfig } from '@/lib/sort-utils'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  RECONCILED: 'bg-green-100 text-green-800',
  FINAL: 'bg-blue-100 text-blue-800',
}

export default function StorageReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [editingView, setEditingView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'desc' })

  const availableColumns = [
    { id: 'waterYear', label: 'Water Year' },
    { id: 'period', label: 'Period' },
    { id: 'status', label: 'Status' },
    { id: 'reconciled', label: 'Reconciled' },
    { id: 'dataQuality', label: 'Quality' },
    { id: 'maxAbsDiffAf', label: 'Max |diff| AF' },
    { id: 'dateCode', label: 'Date Code' },
    { id: 'createdAt', label: 'Created' },
  ]

  useEffect(() => {
    fetchReports()
    fetchListViews(true)
  }, [])

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/storage-reports', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) setReports(await response.json())
    } catch (err) {
      console.error('Error fetching storage reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchListViews = async (autoSelectDefault = false) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=storageReport', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setListViews(data)
        if (autoSelectDefault) {
          const defaultView = data.find((v: any) => v.isDefault)
          if (defaultView) setSelectedView(defaultView)
        }
      }
    } catch (error) {
      console.error('Error fetching list views:', error)
    }
  }

  const applyFilters = (items: any[], filters: any[]) =>
    items.filter((item) =>
      filters.every((filter) => {
        if (!filter.field || filter.value === '') return true
        const value = item[filter.field] ?? ''
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

  const sortedAndFiltered = (() => {
    let result = reports
    if (selectedView?.filters?.length) result = applyFilters(result, selectedView.filters)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (r) =>
          String(r.waterYear).includes(term) ||
          (r.period || '').toLowerCase().includes(term) ||
          (r.status || '').toLowerCase().includes(term)
      )
    }
    return sortItems(result, sortConfig)
  })()

  const handleSaveListView = async (view: { id?: string; name: string; columns: string[]; filters: any[]; isDefault: boolean }) => {
    const token = localStorage.getItem('token')
    const url = view.id ? `/api/admin/list-views/${view.id}` : '/api/admin/list-views'
    const response = await fetch(url, {
      method: view.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...view, entityType: 'storageReport' }),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to save list view')
    }
    const saved = await response.json()
    await fetchListViews()
    setSelectedView(saved)
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Are you sure you want to delete this list view?')) return
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/admin/list-views/${viewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      if (selectedView?.id === viewId) setSelectedView(null)
      await fetchListViews()
    }
  }

  const getVisibleColumns = () =>
    selectedView?.columns?.length ? selectedView.columns : availableColumns.map((c) => c.id)

  const renderColumnValue = (report: any, columnId: string) => {
    switch (columnId) {
      case 'waterYear':
        return (
          <Link href={`/admin/storage-reports/${report.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
            WY {report.waterYear}
          </Link>
        )
      case 'period':
        return report.period || `${String(report.startDate).slice(0, 10)} – ${String(report.endDate).slice(0, 10)}`
      case 'status':
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[report.status] || 'bg-gray-100'}`}>
            {report.status}
          </span>
        )
      case 'reconciled':
        return report.reconciled ? (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Within 1 AF</span>
        ) : report.result ? (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Needs review</span>
        ) : (
          <span className="text-gray-400">—</span>
        )
      case 'dataQuality':
        return report.dataQuality === 'CORRECTED' ? 'Corrected' : 'Provisional'
      case 'maxAbsDiffAf':
        return report.maxAbsDiffAf == null ? '—' : Number(report.maxAbsDiffAf).toFixed(2)
      case 'createdAt':
        return new Date(report.createdAt).toLocaleDateString()
      default:
        return report[columnId] ?? '—'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">Storage Reports</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams()
                if (searchTerm) params.set('search', searchTerm)
                if (selectedView?.id) params.set('viewId', selectedView.id)
                window.open(`/admin/storage-reports/print?${params.toString()}`, '_blank')
              }}
              className="sf-btn sf-btn-secondary"
            >
              🖨 Print
            </button>
            <button
              onClick={() => { setEditingView(null); setShowListViewModal(true) }}
              className="sf-btn sf-btn-secondary"
            >
              New List View
            </button>
            <Link href="/admin/storage-reports/new" className="sf-btn sf-btn-primary">
              + New Storage Report
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex gap-4 items-center">
              <div className="flex-1">
                <select
                  value={selectedView?.id || ''}
                  onChange={(e) => setSelectedView(listViews.find((v) => v.id === e.target.value) || null)}
                  className="sf-input w-full"
                >
                  <option value="">All Storage Reports (Default View)</option>
                  {listViews.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name}{view.isDefault ? ' ★' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {selectedView && (
                <div className="flex gap-2 items-center">
                  <button onClick={() => { setEditingView(selectedView); setShowListViewModal(true) }} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                  <button onClick={() => handleDeleteView(selectedView.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by water year, period, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="sf-input w-full"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading storage reports...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {getVisibleColumns().map((columnId: string) => {
                        const column = availableColumns.find((c) => c.id === columnId)
                        const isSorted = sortConfig.column === columnId
                        return (
                          <th
                            key={columnId}
                            onClick={() => setSortConfig(nextSortConfig(sortConfig, columnId))}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                          >
                            <span className="flex items-center gap-1">
                              {column?.label}
                              {isSorted && <span className="text-gray-400">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                            </span>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={getVisibleColumns().length} className="px-6 py-8 text-center text-gray-500">
                          No storage reports found
                        </td>
                      </tr>
                    ) : (
                      sortedAndFiltered.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          {getVisibleColumns().map((columnId: string) => (
                            <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {renderColumnValue(report, columnId)}
                            </td>
                          ))}
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
        onClose={() => { setShowListViewModal(false); setEditingView(null) }}
        entityType="storageReport"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
        existingView={editingView || undefined}
      />
    </div>
  )
}
