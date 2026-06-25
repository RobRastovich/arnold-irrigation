'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'
import { formatDateTimeInTimezone } from '@/lib/date-utils'

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purging, setPurging] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [purgeOptions, setPurgeOptions] = useState({
    afterDate: '',
    beforeDate: '',
    tableName: '',
  })
  const [filter, setFilter] = useState({
    tableName: '',
    recordId: '',
    startDate: '',
    endDate: '',
  })
  const [userTimezone, setUserTimezone] = useState('America/Los_Angeles')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)

  const availableColumns = [
    { id: 'createdAt', label: 'Date/Time' },
    { id: 'action', label: 'Action' },
    { id: 'tableName', label: 'Table' },
    { id: 'recordId', label: 'Record ID' },
    { id: 'changedBy', label: 'Changed By' },
  ]

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUserTimezone(parsedUser.timezone || 'America/Los_Angeles')
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    fetchListViews()
  }, [])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (filter.tableName) params.append('tableName', filter.tableName)
      if (filter.recordId) params.append('recordId', filter.recordId)
      if (filter.startDate) params.append('startDate', filter.startDate)
      if (filter.endDate) params.append('endDate', filter.endDate)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchListViews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=auditLog', {
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

  const applyFilters = (logs: any[], filters: any[]) => {
    return logs.filter((log) => {
      return filters.every((filter) => {
        if (!filter.field || filter.value === '') return true
        const value = log[filter.field] ?? ''
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

  const filteredLogs = (() => {
    let result = logs

    // Apply saved view filters
    if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
      result = applyFilters(result, selectedView.filters)
    }

    // Apply manual filters
    if (filter.tableName) {
      result = result.filter((log) => log.tableName.toLowerCase().includes(filter.tableName.toLowerCase()))
    }
    if (filter.recordId) {
      result = result.filter((log) => log.recordId === filter.recordId)
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
          entityType: 'auditLog',
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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, [e.target.name]: e.target.value })
  }

  const handleSearch = () => {
    setLoading(true)
    fetchLogs()
  }

  const handlePurge = async () => {
    setPurging(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (purgeOptions.afterDate) params.append('afterDate', purgeOptions.afterDate)
      if (purgeOptions.beforeDate) params.append('beforeDate', purgeOptions.beforeDate)
      if (purgeOptions.tableName) params.append('tableName', purgeOptions.tableName)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to purge audit logs')
      }

      const data = await response.json()
      alert(`Successfully purged ${data.deletedCount} audit log records`)
      setShowPurgeDialog(false)
      setPurgeOptions({ afterDate: '', beforeDate: '', tableName: '' })
      fetchLogs()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setPurging(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderChanges = (changes: any) => {
    if (!changes) return null

    // If it's a field-level change object with old/new values
    if (typeof changes === 'object' && !changes.created && !changes.updated && !changes.deleted) {
      return (
        <div className="space-y-2">
          {Object.entries(changes).map(([field, value]: [string, any]) => (
            <div key={field} className="border-l-2 border-primary-500 pl-3">
              <p className="font-medium text-gray-900">{field}</p>
              <div className="text-sm">
                <span className="text-red-600">Old: {String(value.old)}</span>
                <span className="mx-2">→</span>
                <span className="text-green-600">New: {String(value.new)}</span>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Fallback for other formats
    return (
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
        {JSON.stringify(changes, null, 2)}
      </pre>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowListViewModal(true)}
              className="sf-btn sf-btn-secondary"
            >
              Create List View
            </button>
            <button
              onClick={() => setShowPurgeDialog(true)}
              className="sf-btn sf-btn-secondary"
            >
              Purge Logs
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* List View Selector & Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={selectedView?.id || ''}
                    onChange={(e) => {
                      const view = listViews.find((v) => v.id === e.target.value)
                      setSelectedView(view || null)
                    }}
                    className="sf-input w-full"
                  >
                    <option value="">All Audit Logs (Default View)</option>
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
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    name="tableName"
                    placeholder="Filter by table name..."
                    value={filter.tableName}
                    onChange={handleFilterChange}
                    className="sf-input w-full"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    name="recordId"
                    placeholder="Filter by record ID..."
                    value={filter.recordId}
                    onChange={handleFilterChange}
                    className="sf-input w-full"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <input
                    type="date"
                    name="startDate"
                    placeholder="Start date..."
                    value={filter.startDate}
                    onChange={handleFilterChange}
                    className="sf-input w-full"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <input
                    type="date"
                    name="endDate"
                    placeholder="End date..."
                    value={filter.endDate}
                    onChange={handleFilterChange}
                    className="sf-input w-full"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="sf-btn sf-btn-primary"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading audit logs...</p>
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
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={getVisibleColumns().length + 1}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          {getVisibleColumns().map((columnId: string) => {
                            switch (columnId) {
                              case 'createdAt':
                                return (
                                  <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDateTimeInTimezone(log.createdAt, userTimezone)}
                                  </td>
                                )
                              case 'action':
                                return (
                                  <td key={columnId} className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}
                                    >
                                      {log.action}
                                    </span>
                                  </td>
                                )
                              case 'tableName':
                                return (
                                  <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.tableName}
                                  </td>
                                )
                              case 'recordId':
                                return (
                                  <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.recordId || '-'}
                                  </td>
                                )
                              case 'changedBy':
                                return (
                                  <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.changedBy}
                                  </td>
                                )
                              default:
                                return null
                            }
                          })}
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {renderChanges(log.changes)}
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

      {/* Purge Dialog */}
      {showPurgeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Purge Audit Logs</h3>
              <p className="text-gray-600 mb-4">
                This will permanently delete audit log records. This action cannot be undone.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delete logs from this date (optional)
                  </label>
                  <input
                    type="date"
                    value={purgeOptions.afterDate}
                    onChange={(e) => setPurgeOptions({ ...purgeOptions, afterDate: e.target.value })}
                    className="sf-input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to start from the beginning
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delete logs before this date (optional)
                  </label>
                  <input
                    type="date"
                    value={purgeOptions.beforeDate}
                    onChange={(e) => setPurgeOptions({ ...purgeOptions, beforeDate: e.target.value })}
                    className="sf-input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to delete all audit logs
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table name filter (optional)
                  </label>
                  <input
                    type="text"
                    value={purgeOptions.tableName}
                    onChange={(e) => setPurgeOptions({ ...purgeOptions, tableName: e.target.value })}
                    placeholder="e.g., Patron, User"
                    className="sf-input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to delete logs for all tables
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handlePurge}
                  disabled={purging}
                  className="flex-1 sf-btn sf-btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purging ? 'Purging...' : 'Purge Logs'}
                </button>
                <button
                  onClick={() => {
                    setShowPurgeDialog(false)
                    setPurgeOptions({ afterDate: '', beforeDate: '', tableName: '' })
                  }}
                  disabled={purging}
                  className="flex-1 sf-btn sf-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ListViewModal
        isOpen={showListViewModal}
        onClose={() => setShowListViewModal(false)}
        entityType="auditLog"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
      />
    </div>
  )
}
