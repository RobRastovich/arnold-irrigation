'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'
import AssignFeatureUserModal from '@/components/AssignFeatureUserModal'

export default function FeatureDetailPage() {
  const params = useParams()
  const [feature, setFeature] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchFeature()
  }, [params.id])

  const fetchFeature = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/features/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch feature')
      }
      setFeature(await response.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Remove this feature from the user?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/features/${params.id}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove user')
      }
      fetchFeature()
    } catch (err: any) {
      setError(err.message)
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

  if (error && !feature) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/admin/features" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Features
          </Link>
        </div>
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Feature not found</p>
          <Link href="/admin/features" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Features
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{feature.name}</h2>
          <Link href="/admin/features" className="sf-btn sf-btn-secondary">
            Back to Features
          </Link>
        </header>

        <main className="flex-1 p-4">
          <div className="space-y-3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="sf-card">
              <div className="sf-card-header">Basic Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="sf-field-label">Name</p>
                  <p className="sf-field-value">{feature.icon} {feature.name}</p>
                </div>
                <div>
                  <p className="sf-field-label">Tab Key</p>
                  <p className="sf-field-value">{feature.key}</p>
                </div>
                <div>
                  <p className="sf-field-label">Path</p>
                  <p className="sf-field-value">{feature.href}</p>
                </div>
              </div>
            </div>

            <WindowShade
              title={`Assigned Users (${feature.users?.length || 0})`}
              defaultOpen={false}
              actionButton={
                <button
                  className="sf-btn sf-btn-secondary text-xs"
                  onClick={() => setShowModal(true)}
                >
                  Assign User
                </button>
              }
            >
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(feature.users || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-gray-500">No users assigned</td>
                    </tr>
                  ) : (
                    feature.users.map((assignedUser: any) => (
                      <tr key={assignedUser.id}>
                        <td>
                          <Link
                            href={`/admin/users/${assignedUser.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {assignedUser.firstName} {assignedUser.lastName}
                          </Link>
                        </td>
                        <td>{assignedUser.email}</td>
                        <td>{assignedUser.role}</td>
                        <td>{assignedUser.isActive ? 'Active' : 'Inactive'}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveUser(assignedUser.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </WindowShade>
          </div>
        </main>
      </div>

      <AssignFeatureUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureId={feature.id}
        featureKey={feature.key}
        assignedUserIds={(feature.users || []).map((u: any) => u.id)}
        onUserAdded={fetchFeature}
      />
    </div>
  )
}
