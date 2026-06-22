'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)

  const availableColumns = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role' },
    { id: 'isActive', label: 'Status' },
    { id: 'phone', label: 'Phone' },
    { id: 'city', label: 'City' },
    { id: 'state', label: 'State' },
  ]

  useEffect(() => {
    fetchUsers()
    fetchListViews()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchListViews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/list-views?entityType=user', {
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

  const applyFilters = (users: any[], filters: any[]) => {
    return users.filter((user) => {
      return filters.every((filter) => {
        const value = user[filter.field]
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

  const filteredUsers = (() => {
    let result = users

    // Apply saved view filters
    if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
      result = applyFilters(result, selectedView.filters)
    }

    // Apply search term
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          entityType: 'user',
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

  const renderColumnValue = (user: any, columnId: string) => {
    switch (columnId) {
      case 'name':
        return (
          <Link
            href={`/admin/users/${user.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            {user.firstName} {user.lastName}
          </Link>
        )
      case 'email':
        return user.email
      case 'role':
        const roleColor: Record<string, string> = {
          ADMIN: 'bg-purple-100 text-purple-800',
          STAFF: 'bg-blue-100 text-blue-800',
          PATRON: 'bg-gray-100 text-gray-800',
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColor[user.role] || 'bg-gray-100 text-gray-800'}`}>
            {user.role}
          </span>
        )
      case 'isActive':
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        )
      case 'phone':
        return user.phone || '-'
      case 'city':
        return user.city || '-'
      case 'state':
        return user.state || '-'
      default:
        return '-'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowListViewModal(true)}
              className="sf-btn sf-btn-secondary"
            >
              Create List View
            </button>
            <Link
              href="/admin/users/new"
              className="sf-btn sf-btn-primary"
            >
              Add User
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
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
                  <option value="">All Users (Default View)</option>
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
                  placeholder="Search by name or email..."
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
                <p className="mt-2 text-gray-600">Loading users...</p>
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={getVisibleColumns().length + 1}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          {getVisibleColumns().map((columnId: string) => (
                            <td
                              key={columnId}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {renderColumnValue(user, columnId)}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/users/${user.id}/edit`}
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
        entityType="user"
        availableColumns={availableColumns}
        onSave={handleSaveListView}
      />
    </div>
  )
}
