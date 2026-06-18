'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { formatDateTimeInTimezone } from '@/lib/date-utils'

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purging, setPurging] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [purgeOptions, setPurgeOptions] = useState({
    beforeDate: '',
    tableName: '',
  })
  const [filter, setFilter] = useState({
    tableName: '',
    recordId: '',
  })
  const [userTimezone, setUserTimezone] = useState('America/Los_Angeles')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUserTimezone(parsedUser.timezone || 'America/Los_Angeles')
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (filter.tableName) params.append('tableName', filter.tableName)
      if (filter.recordId) params.append('recordId', filter.recordId)

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
      setPurgeOptions({ beforeDate: '', tableName: '' })
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
          <button
            onClick={() => setShowPurgeDialog(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex-shrink-0"
          >
            Purge Logs
          </button>
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
                    name="tableName"
                    placeholder="Filter by table name..."
                    value={filter.tableName}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    name="recordId"
                    placeholder="Filter by record ID..."
                    value={filter.recordId}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
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
                <p className="mt-2 text-gray-600">Loading audit logs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Old Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changed By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        // Check if changes are in field-level format
                        const isFieldLevel = typeof log.changes === 'object' &&
                          !log.changes.created &&
                          !log.changes.updated &&
                          !log.changes.deleted

                        if (isFieldLevel) {
                          // Render one row per field change
                          return Object.entries(log.changes).map(([field, value]: [string, any], index) => (
                            <tr key={`${log.id}-${index}`} className="hover:bg-gray-50">
                              {index === 0 ? (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={Object.keys(log.changes).length}>
                                    {formatDateTimeInTimezone(log.createdAt, userTimezone)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap" rowSpan={Object.keys(log.changes).length}>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}
                                    >
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={Object.keys(log.changes).length}>
                                    {log.tableName}
                                  </td>
                                </>
                              ) : null}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {field}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {String(value.old)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {String(value.new)}
                              </td>
                              {index === 0 ? (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={Object.keys(log.changes).length}>
                                  {log.changedBy}
                                </td>
                              ) : null}
                            </tr>
                          ))
                        } else {
                          // Fallback for other formats (CREATE, DELETE, or old format)
                          return (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDateTimeInTimezone(log.createdAt, userTimezone)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.tableName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>
                                {renderChanges(log.changes)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.changedBy}
                              </td>
                            </tr>
                          )
                        }
                      })
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
                    Delete logs before this date (optional)
                  </label>
                  <input
                    type="date"
                    value={purgeOptions.beforeDate}
                    onChange={(e) => setPurgeOptions({ ...purgeOptions, beforeDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purging ? 'Purging...' : 'Purge Logs'}
                </button>
                <button
                  onClick={() => {
                    setShowPurgeDialog(false)
                    setPurgeOptions({ beforeDate: '', tableName: '' })
                  }}
                  disabled={purging}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
