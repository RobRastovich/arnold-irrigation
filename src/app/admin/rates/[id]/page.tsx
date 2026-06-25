'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import RateForm from '@/components/RateForm'

export default function RateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [rate, setRate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/admin/rates/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Rate not found')
        setRate(await res.json())
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRate()
  }, [params.id])

  const handleSave = async (data: any) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/rates/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to update rate')
    }
    setRate(await res.json())
  }

  const handleDelete = async () => {
    if (!confirm('Delete this rate? This cannot be undone.')) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/rates/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/admin/rates')
    } catch (err: any) {
      alert(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/rates')} className="text-gray-500 hover:text-gray-700 text-sm">
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {rate?.rateCode} — {rate?.year}
              </h1>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="sf-btn sf-btn-danger text-sm"
            >
              {deleting ? 'Deleting…' : 'Delete Rate'}
            </button>
          </div>
          {rate && <RateForm initialData={rate} onSave={handleSave} />}
        </div>
      </main>
    </div>
  )
}
