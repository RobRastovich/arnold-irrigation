'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import AddRateItemModal from '@/components/AddRateItemModal'

const CHARGE_TYPE_LABELS: Record<string, string> = {
  TAXLOT: 'Tax Lot',
  ACRE_OF_WATER: 'Acre of Water',
  PER_SEASON: 'Per Season',
}

export default function RateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [rate, setRate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editYear, setEditYear] = useState('')
  const [savingYear, setSavingYear] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => { fetchRate() }, [params.id])

  const fetchRate = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/rates/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Rate not found')
      const data = await res.json()
      setRate(data)
      setEditYear(String(data.year))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveYear = async () => {
    setSavingYear(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/rates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year: parseInt(editYear) }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setRate(await res.json())
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingYear(false)
    }
  }

  const handleGenerateAssessment = async () => {
    if (!confirm(`Generate assessment invoices for all active patrons using rate year ${rate?.year}? This cannot be undone.`)) return
    setGenerating(true)
    setGenResult(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/rates/${params.id}/generate-assessment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')
      setGenResult({ type: 'success', message: data.message })
    } catch (err: any) {
      setGenResult({ type: 'error', message: err.message })
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteRate = async () => {
    if (!confirm('Delete this rate schedule and all its items? This cannot be undone.')) return
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

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this rate item?')) return
    const token = localStorage.getItem('token')
    await fetch(`/api/admin/rates/${params.id}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchRate()
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-red-600">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/rates')} className="text-gray-500 hover:text-gray-700 text-sm">
                ← Rates
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Rate Schedule — {rate?.year}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateAssessment}
                disabled={generating}
                className="sf-btn sf-btn-primary"
              >
                {generating ? 'Generating…' : '⚡ Generate Assessment'}
              </button>
              <button onClick={() => router.push('/admin/invoices?rateId=' + params.id)} className="sf-btn sf-btn-secondary text-sm">
                View Invoices
              </button>
              <button onClick={handleDeleteRate} disabled={deleting} className="sf-btn sf-btn-danger text-sm">
                {deleting ? 'Deleting…' : 'Delete Schedule'}
              </button>
            </div>
          </div>

          {/* Generation result banner */}
          {genResult && (
            <div className={`rounded-lg p-4 text-sm font-medium ${
              genResult.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {genResult.message}
              {genResult.type === 'success' && (
                <button
                  onClick={() => router.push('/admin/invoices?rateId=' + params.id)}
                  className="ml-4 underline"
                >
                  View Invoices →
                </button>
              )}
            </div>
          )}

          {/* Year editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Schedule Details</h2>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="sf-input w-32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="sf-field-value">{rate ? new Date(rate.createdAt).toLocaleString() : ''}</p>
              </div>
              <button
                onClick={handleSaveYear}
                disabled={savingYear || editYear === String(rate?.year)}
                className="sf-btn sf-btn-primary"
              >
                {savingYear ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Rate Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">
                Rate Items ({rate?.items?.length ?? 0})
              </h2>
              <button onClick={() => { setEditingItem(null); setShowAddItem(true) }} className="sf-btn sf-btn-primary text-sm">
                + Add Item
              </button>
            </div>

            {rate?.items?.length === 0 ? (
              <p className="text-gray-500 text-sm p-6">No rate items yet. Click "+ Add Item" to add one.</p>
            ) : (
              <table className="sf-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Rate Code</th>
                    <th className="text-left">Rate Type</th>
                    <th className="text-left">Charge Type</th>
                    <th className="text-right">Assessment</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rate?.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="font-mono text-sm">{item.rateCode}</td>
                      <td>{item.rateType?.name}</td>
                      <td>{CHARGE_TYPE_LABELS[item.chargeType] ?? item.chargeType}</td>
                      <td className="text-right font-mono">${Number(item.assessment).toFixed(2)}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingItem(item); setShowAddItem(true) }}
                            className="text-xs text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-xs text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <AddRateItemModal
        isOpen={showAddItem}
        onClose={() => { setShowAddItem(false); setEditingItem(null) }}
        rateId={params.id as string}
        initialData={editingItem}
        onSaved={fetchRate}
      />
    </div>
  )
}
