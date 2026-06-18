'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.firstName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-500 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary-800">Account Information</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Phone:</span> {user.phone}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary-800">Address</h2>
            <div className="space-y-2 text-sm">
              <p>{user.address}</p>
              <p>{user.city}, {user.state} {user.zip}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary-800">Account Status</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Status:</span> {user.isActive ? 'Active' : 'Inactive'}</p>
              <p><span className="font-medium">Email Verified:</span> {user.emailVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Member Since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-primary-50 text-primary-800 p-4 rounded-lg hover:bg-primary-100 transition text-left">
              <h3 className="font-semibold">View Bills</h3>
              <p className="text-sm text-gray-600">View and pay your irrigation bills</p>
            </button>
            <button className="bg-primary-50 text-primary-800 p-4 rounded-lg hover:bg-primary-100 transition text-left">
              <h3 className="font-semibold">Water Usage</h3>
              <p className="text-sm text-gray-600">View your water consumption history</p>
            </button>
            <button className="bg-primary-50 text-primary-800 p-4 rounded-lg hover:bg-primary-100 transition text-left">
              <h3 className="font-semibold">Update Profile</h3>
              <p className="text-sm text-gray-600">Update your contact information</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
