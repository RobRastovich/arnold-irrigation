'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface Patron {
  accountNumber: string
  firstName: string
  lastName: string
}

export default function NewTurnoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [patrons, setPatrons] = useState<Patron[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    accountNumber: '',
    canal: '',
    gate: '',
    deliveredAcres: '',
    acresOwned: '',
    taxLotNumber: '',
    legalDescription: '',
  })

  useEffect(() => {
    fetchPatrons()
    // Pre-populate accountNumber from URL parameter
    const accountNumber = searchParams.get('accountNumber')
    if (accountNumber) {
      setFormData(prev => ({ ...prev, accountNumber }))
    }
  }, [searchParams])

  const fetchPatrons = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/patrons', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patrons')
      }

      const data = await response.json()
      setPatrons(data)
    } catch (err) {
      setError('Error loading patrons')
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
      const response = await fetch('/api/admin/turnouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create turnout'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Response body might not be JSON
        }
        throw new Error(errorMessage)
      }

      router.push('/admin/turnouts')
    } catch (err: any) {
      setError(err.message || 'Error creating turnout')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/turnouts')}
              className="text-primary-600 hover:text-primary-900 mb-4 inline-block"
            >
              ← Back to Turnouts
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Turnout</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patron *
              </label>
              <select
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a patron</option>
                {patrons.map((patron) => (
                  <option key={patron.accountNumber} value={patron.accountNumber}>
                    {patron.firstName} {patron.lastName} ({patron.accountNumber})
                  </option>
                ))}
              </select>
            </div>

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
                onClick={() => router.push('/admin/turnouts')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Turnout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
