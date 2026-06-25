'use client'

import { useState } from 'react'

const DECIMAL_FIELDS = [
  { id: 'ownerAccount', label: 'Owner Account' },
  { id: 'administrativeFee', label: 'Administrative Fee' },
  { id: 'capitalImprovement', label: 'Capital Improvement' },
  { id: 'construction', label: 'Construction' },
  { id: 'debtRetirement', label: 'Debt Retirement' },
  { id: 'interestCharge', label: 'Interest Charge' },
  { id: 'maintenanceFee', label: 'Maintenance Fee' },
  { id: 'operations', label: 'Operations' },
  { id: 'modernizationFund', label: 'Modernization Fund' },
  { id: 'releaseOfLienFee', label: 'Release of Lien Fee' },
  { id: 'taxLotFee', label: 'Tax Lot Fee' },
  { id: 'waterProtectionFund', label: 'Water Protection Fund' },
]

function emptyForm() {
  const base: any = { rateCode: '', year: new Date().getFullYear() }
  DECIMAL_FIELDS.forEach((f) => { base[f.id] = '' })
  return base
}

interface RateFormProps {
  initialData?: any
  onSave: (data: any) => Promise<void>
}

export default function RateForm({ initialData, onSave }: RateFormProps) {
  const [form, setForm] = useState<any>(() => {
    if (!initialData) return emptyForm()
    const f: any = { rateCode: initialData.rateCode, year: initialData.year }
    DECIMAL_FIELDS.forEach((field) => {
      f[field.id] = initialData[field.id] !== undefined && initialData[field.id] !== null
        ? Number(initialData[field.id]).toFixed(2)
        : ''
    })
    return f
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload: any = {
        rateCode: form.rateCode.trim(),
        year: parseInt(form.year),
      }
      DECIMAL_FIELDS.forEach((f) => {
        payload[f.id] = form[f.id] === '' ? 0 : parseFloat(form[f.id])
      })
      await onSave(payload)
      setSuccess('Saved successfully.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>
      )}

      {/* Identity fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Rate Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Code *</label>
            <input
              type="text"
              maxLength={25}
              value={form.rateCode}
              onChange={(e) => handleChange('rateCode', e.target.value)}
              className="sf-input w-full"
              required
              placeholder="e.g. STD-A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className="sf-input w-full"
              required
            />
          </div>
        </div>
      </div>

      {/* Rate fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Rate Values</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {DECIMAL_FIELDS.map((f) => (
            <div key={f.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form[f.id]}
                  onChange={(e) => handleChange(f.id, e.target.value)}
                  className="sf-input w-full pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="sf-btn sf-btn-primary px-8">
          {saving ? 'Saving…' : 'Save Rate'}
        </button>
      </div>
    </form>
  )
}
