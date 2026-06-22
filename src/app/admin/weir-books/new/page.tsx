'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default function NewWeirBookPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    canal: '',
    weirLocation: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/weir-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create weir book')
      }

      const wb = await response.json()
      router.push(`/admin/weir-books/${wb.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">New Weir Book</h2>
          <button
            onClick={() => router.push('/admin/weir-books')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canal *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Weir Location *</label>
                <input
                  type="number"
                  name="weirLocation"
                  value={formData.weirLocation}
                  onChange={handleChange}
                  required
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/weir-books')}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Weir Book'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
