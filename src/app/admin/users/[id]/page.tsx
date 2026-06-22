'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { formatDateTimeInTimezone } from '@/lib/date-utils'

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
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
    fetchUser()
  }, [params.id])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      setUser(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'STAFF':
        return 'bg-blue-100 text-blue-800'
      case 'PATRON':
        return 'bg-gray-100 text-gray-800'
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
          <Link href="/admin/users" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Link href="/admin/users" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="sf-btn sf-btn-primary"
            >
              Edit
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="space-y-3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="sf-card">
              <div className="sf-card-header">Basic Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="sf-field-label">Name</p>
                  <p className="sf-field-value">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="sf-field-label">Email</p>
                  <p className="sf-field-value">{user.email}</p>
                </div>
                <div>
                  <p className="sf-field-label">Role</p>
                  <p className="sf-field-value">{user.role}</p>
                </div>
                <div>
                  <p className="sf-field-label">Status</p>
                  <p className="sf-field-value">{user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="sf-field-label">Email Verified</p>
                  <p className="sf-field-value">{user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="sf-field-label">Timezone</p>
                  <p className="sf-field-value">{user.timezone}</p>
                </div>
                <div>
                  <p className="sf-field-label">Phone</p>
                  <p className="sf-field-value">{user.phone || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="sf-field-label">Address</p>
                  <p className="sf-field-value">{user.address || '-'}</p>
                </div>
                <div>
                  <p className="sf-field-label">City</p>
                  <p className="sf-field-value">{user.city || '-'}</p>
                </div>
                <div>
                  <p className="sf-field-label">State</p>
                  <p className="sf-field-value">{user.state || '-'}</p>
                </div>
                <div>
                  <p className="sf-field-label">ZIP</p>
                  <p className="sf-field-value">{user.zip || '-'}</p>
                </div>
                <div>
                  <p className="sf-field-label">Created At</p>
                  <p className="sf-field-value">{formatDateTimeInTimezone(user.createdAt, userTimezone)}</p>
                </div>
                <div>
                  <p className="sf-field-label">Updated At</p>
                  <p className="sf-field-value">{formatDateTimeInTimezone(user.updatedAt, userTimezone)}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
