'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

export default function RatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [creating, setCreating] = useState(false)
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()))
  const [showNewForm, setShowNewForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchRates() }, [])

  const fetchRates = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/rates', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setRates(await res.json())
    } catch (err) {
      console.error('Error fetching rates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year: parseInt(newYear) }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to create')
      }
      const created = await res.json()
      window.location.href = `/admin/rates/${created.id}`
    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  const filtered = rates.filter((r) => String(r.year).includes(searchTerm))

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rates</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} rate schedule{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/rate-types" className="sf-btn sf-btn-secondary text-sm">
              Manage Rate Types
            </Link>
            <button onClick={() => setShowNewForm(true)} className="sf-btn sf-btn-primary">
              + New Rate Schedule
            </button>
          </div>
        </div>

        {/* New Rate inline form */}
        {showNewForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-base font-semibold text-gray-800 mb-3">New Rate Schedule</h2>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="sf-input w-32"
                  required
                />
              </div>
              <button type="submit" disabled={creating} className="sf-btn sf-btn-primary">
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="sf-btn sf-btn-secondary">
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <input
            type="text"
            placeholder="Filter by year…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sf-input w-full max-w-xs"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-16 text-gray-500">
              {searchTerm ? 'No rate schedules match.' : 'No rate schedules yet.'}
            </div>
          ) : (
            <table className="sf-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Year</th>
                  <th className="text-left">Rate Items</th>
                  <th className="text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="font-medium">
                      <Link href={`/admin/rates/${rate.id}`} className="text-blue-600 hover:text-blue-900">
                        {rate.year}
                      </Link>
                    </td>
                    <td>{rate.items?.length ?? 0} item{(rate.items?.length ?? 0) !== 1 ? 's' : ''}</td>
                    <td className="text-sm text-gray-500">
                      {new Date(rate.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
