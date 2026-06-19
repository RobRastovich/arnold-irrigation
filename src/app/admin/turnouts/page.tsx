'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface Turnout {
  id: string
  accountNumber: string
  canal: string
  gate: string
  deliveredAcres: number
  acresOwned: number
  taxLotNumber: string
  legalDescription: string
  patron?: {
    firstName: string
    lastName: string
  }
}

interface TurnoutGroup {
  accountNumber: string
  patronName: string
  turnouts: Turnout[]
  totalDeliveredAcres: number
  totalAcresOwned: number
}

export default function TurnoutsPage() {
  const router = useRouter()
  const [turnouts, setTurnouts] = useState<Turnout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTurnouts()
  }, [])

  const fetchTurnouts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/turnouts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch turnouts')
      }

      const data = await response.json()
      setTurnouts(data)
    } catch (err) {
      setError('Error loading turnouts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Group turnouts by account number and calculate totals
  const groupedTurnouts = turnouts.reduce((acc: Record<string, TurnoutGroup>, turnout) => {
    if (!acc[turnout.accountNumber]) {
      acc[turnout.accountNumber] = {
        accountNumber: turnout.accountNumber,
        patronName: `${turnout.patron?.firstName || ''} ${turnout.patron?.lastName || ''}`.trim() || turnout.accountNumber,
        turnouts: [],
        totalDeliveredAcres: 0,
        totalAcresOwned: 0,
      }
    }
    acc[turnout.accountNumber].turnouts.push(turnout)
    acc[turnout.accountNumber].totalDeliveredAcres += turnout.deliveredAcres
    acc[turnout.accountNumber].totalAcresOwned += turnout.acresOwned
    return acc
  }, {})

  const groups = Object.values(groupedTurnouts)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Turnouts</h1>
            <button
              onClick={() => router.push('/admin/turnouts/new')}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Add Turnout
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {groups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No turnouts found. Click "Add Turnout" to create one.
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.accountNumber} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{group.patronName}</h2>
                      <p className="text-sm text-gray-500">Account: {group.accountNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Delivered:</span> {group.totalDeliveredAcres.toFixed(2)} acres
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Owned:</span> {group.totalAcresOwned.toFixed(2)} acres
                      </p>
                    </div>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered Acres</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acres Owned</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Lot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legal Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.turnouts.map((turnout) => (
                        <tr key={turnout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{turnout.canal}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{turnout.gate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{turnout.deliveredAcres.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{turnout.acresOwned.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{turnout.taxLotNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{turnout.legalDescription}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/admin/turnouts/${turnout.id}`)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              View
                            </button>
                            <button
                              onClick={() => router.push(`/admin/turnouts/${turnout.id}/edit`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
