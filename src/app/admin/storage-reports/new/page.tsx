'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default function NewStorageReportPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [finals, setFinals] = useState<any[]>([])
  const [formData, setFormData] = useState({
    startDate: '2026-08-15',
    endDate: '2026-08-31',
    dateCode: '3',
    copyFromId: '',
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/storage-reports', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setFinals(data.filter((r: any) => r.status === 'FINAL'))
      }
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/storage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          dateCode: Number(formData.dateCode),
          copyFromId: formData.copyFromId || undefined,
          notes: formData.notes,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create storage report')
      }
      const report = await response.json()
      router.push(`/admin/storage-reports/${report.id}`)
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
          <h2 className="text-xl font-semibold text-gray-900">New Storage Report</h2>
          <button onClick={() => router.push('/admin/storage-reports')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
            Cancel
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decree date code</label>
                <select name="dateCode" value={formData.dateCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="1">1 — Apr 1–30 & Oct 1–31</option>
                  <option value="2">2 — May 1–14 & Sep 15–30</option>
                  <option value="3">3 — May 15–Sep 14</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Copy ending balances from FINAL report</label>
                <select name="copyFromId" value={formData.copyFromId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Latest FINAL before start date (if any)</option>
                  {finals.map((r) => (
                    <option key={r.id} value={r.id}>
                      WY {r.waterYear} · {r.period}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => router.push('/admin/storage-reports')} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Storage Report'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
