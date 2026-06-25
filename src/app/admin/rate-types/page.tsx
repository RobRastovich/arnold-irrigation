'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'

export default function RateTypesPage() {
  const [rateTypes, setRateTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => { fetchRateTypes() }, [])

  const fetchRateTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/rate-types', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setRateTypes(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/rate-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), sortOrder: rateTypes.length }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add')
      }
      setNewName('')
      fetchRateTypes()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/rate-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) {
      setEditingId(null)
      fetchRateTypes()
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/rate-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive }),
    })
    fetchRateTypes()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete rate type "${name}"? This will fail if any rate items use it.`)) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/admin/rate-types/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed to delete')
    } else {
      fetchRateTypes()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/rates" className="text-gray-500 hover:text-gray-700 text-sm">← Rates</Link>
            <h1 className="text-2xl font-bold text-gray-900">Manage Rate Types</h1>
          </div>

          {/* Add new */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Add Rate Type</h2>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Modernization Fund"
                className="sf-input flex-1"
                required
              />
              <button type="submit" disabled={adding} className="sf-btn sf-btn-primary">
                {adding ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Rate Types ({rateTypes.length})</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : rateTypes.length === 0 ? (
              <p className="text-gray-500 text-sm p-6">No rate types yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {rateTypes.map((rt) => (
                  <li key={rt.id} className="flex items-center justify-between px-5 py-3">
                    {editingId === rt.id ? (
                      <div className="flex gap-2 flex-1 mr-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="sf-input flex-1"
                          autoFocus
                        />
                        <button onClick={() => handleUpdate(rt.id)} className="sf-btn sf-btn-primary text-sm">Save</button>
                        <button onClick={() => setEditingId(null)} className="sf-btn sf-btn-secondary text-sm">Cancel</button>
                      </div>
                    ) : (
                      <span className={`flex-1 text-sm font-medium ${!rt.isActive ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {rt.name}
                      </span>
                    )}
                    {editingId !== rt.id && (
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rt.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {rt.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => { setEditingId(rt.id); setEditName(rt.name) }}
                          className="text-xs text-blue-600 hover:text-blue-900"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleToggleActive(rt.id, rt.isActive)}
                          className="text-xs text-yellow-600 hover:text-yellow-900"
                        >
                          {rt.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(rt.id, rt.name)}
                          className="text-xs text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
