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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex-shrink-0"
            >
              Edit User
            </Link>
            <Link
              href="/admin/users"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex-shrink-0"
            >
              Back to Users
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* User Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(user.role)}`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="text-sm text-gray-900">{user.role}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900">{user.isActive ? 'Active' : 'Inactive'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                      <dd className="text-sm text-gray-900">{user.emailVerified ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                      <dd className="text-sm text-gray-900">{user.timezone}</dd>
                    </div>
                  </dl>
                </div>

                {/* Personal Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">First Name</dt>
                      <dd className="text-sm text-gray-900">{user.firstName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                      <dd className="text-sm text-gray-900">{user.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{user.phone || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Address Information */}
                <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                      <dd className="text-sm text-gray-900">{user.address || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">City</dt>
                        <dd className="text-sm text-gray-900">{user.city || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">State</dt>
                        <dd className="text-sm text-gray-900">{user.state || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ZIP</dt>
                        <dd className="text-sm text-gray-900">{user.zip || 'N/A'}</dd>
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Timestamps */}
                <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created At</dt>
                      <dd className="text-sm text-gray-900">
                        {formatDateTimeInTimezone(user.createdAt, userTimezone)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                      <dd className="text-sm text-gray-900">
                        {formatDateTimeInTimezone(user.updatedAt, userTimezone)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
