'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/admin/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'STAFF') {
      router.push('/admin/login')
      return
    }

    setUser(parsedUser)
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Total Patrons</h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-green-600 mt-2">+12% from last month</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                <span className="text-2xl">🟢</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">892</p>
              <p className="text-sm text-gray-500 mt-2">72% of total</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">$45,678</p>
              <p className="text-sm text-green-600 mt-2">+8% from last month</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Issues</h3>
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">23</p>
              <p className="text-sm text-orange-600 mt-2">Requires attention</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">U{i}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">User {i}</p>
                        <p className="text-sm text-gray-500">user{i}@example.com</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">2h ago</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Database</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">Operational</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">API Server</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">Operational</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Email Service</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">Degraded</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Payment Gateway</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">Operational</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
