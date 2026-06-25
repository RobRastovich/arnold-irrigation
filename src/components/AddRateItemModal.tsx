'use client'

import { useEffect, useState } from 'react'

const CHARGE_TYPES = [
  { value: 'TAXLOT', label: 'Tax Lot' },
  { value: 'ACRE_OF_WATER', label: 'Acre of Water' },
  { value: 'PER_SEASON', label: 'Per Season' },
]

interface AddRateItemModalProps {
  isOpen: boolean
  onClose: () => void
  rateId: string
  initialData?: any
  onSaved: () => void
}

export default function AddRateItemModal({
  isOpen, onClose, rateId, initialData, onSaved,
}: AddRateItemModalProps) {
  const [rateTypes, setRateTypes] = useState<any[]>([])
  const [rateTypeId, setRateTypeId] = useState('')
  const [rateCode, setRateCode] = useState('')
  const [chargeType, setChargeType] = useState('TAXLOT')
  const [assessment, setAssessment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) fetchRateTypes()
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      setRateTypeId(initialData.rateTypeId || '')
      setRateCode(initialData.rateCode || '')
      setChargeType(initialData.chargeType || 'TAXLOT')
      setAssessment(initialData.assessment !== undefined ? Number(initialData.assessment).toFixed(2) : '')
    } else {
      setRateTypeId('')
      setRateCode('')
      setChargeType('TAXLOT')
      setAssessment('')
    }
    setError('')
  }, [initialData, isOpen])

  const fetchRateTypes = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/rate-types', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setRateTypes(data.filter((rt: any) => rt.isActive))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const isEdit = !!initialData?.id
      const url = isEdit
        ? `/api/admin/rates/${rateId}/items/${initialData.id}`
        : `/api/admin/rates/${rateId}/items`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rateTypeId,
          rateCode: rateCode.trim(),
          chargeType,
          assessment: parseFloat(assessment),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to save')
      }

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Rate Item' : 'Add Rate Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type *</label>
            <select
              value={rateTypeId}
              onChange={(e) => setRateTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">— Select —</option>
              {rateTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Code * <span className="text-gray-400 font-normal">(max 10 chars)</span></label>
            <input
              type="text"
              maxLength={10}
              value={rateCode}
              onChange={(e) => setRateCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              required
              placeholder="e.g. STD-A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type *</label>
            <select
              value={chargeType}
              onChange={(e) => setChargeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {CHARGE_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="sf-btn sf-btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="sf-btn sf-btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : (initialData ? 'Update' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
