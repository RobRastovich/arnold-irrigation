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
}

export default function EditTurnoutPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [turnout, setTurnout] = useState<Turnout | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    canal: '',
    gate: '',
    deliveredAcres: '',
    acresOwned: '',
    taxLotNumber: '',
    legalDescription: '',
  })

  useEffect(() => {
    fetchTurnout()
  }, [params.id])

  const fetchTurnout = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/turnouts/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch turnout')
      }

      const data = await response.json()
      setTurnout(data)
      setFormData({
        canal: data.canal,
        gate: data.gate,
        deliveredAcres: data.deliveredAcres.toString(),
        acresOwned: data.acresOwned.toString(),
        taxLotNumber: data.taxLotNumber || '',
        legalDescription: data.legalDescription || '',
      })
    } catch (err) {
      setError('Error loading turnout')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/turnouts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update turnout')
      }

      router.push(`/admin/turnouts/${params.id}`)
    } catch (err) {
      setError('Error updating turnout')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

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

  if (!turnout) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Turnout not found
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push(`/admin/turnouts/${params.id}`)}
              className="text-primary-600 hover:text-primary-900 mb-4 inline-block"
            >
              ← Back to Turnout Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Turnout</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal *
                </label>
                <input
                  type="text"
                  name="canal"
                  value={formData.canal}
                  onChange={handleChange}
                  required
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gate *
                </label>
                <input
                  type="text"
                  name="gate"
                  value={formData.gate}
                  onChange={handleChange}
                  required
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivered Acres *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="deliveredAcres"
                  value={formData.deliveredAcres}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acres Owned *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="acresOwned"
                  value={formData.acresOwned}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Lot Number
              </label>
              <input
                type="text"
                name="taxLotNumber"
                value={formData.taxLotNumber}
                onChange={handleChange}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Description
              </label>
              <textarea
                name="legalDescription"
                value={formData.legalDescription}
                onChange={handleChange}
                maxLength={255}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push(`/admin/turnouts/${params.id}`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
