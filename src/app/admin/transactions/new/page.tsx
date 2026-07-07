'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface Patron {
  id: string
  accountNumber: string
  firstName: string
  lastName: string
}

interface TransactionItemForm {
  accountNumber: string
  type: 'CANCEL' | 'TRANSFER' | 'ACTIVE'
  toAccountNumber: string
  parcelNumber: string
  legalDescription: string
  taxLot: string
  subdivision: string
  waterRightAcres: string
  transactionDate: string
  memo: string
}

const emptyItem = (): TransactionItemForm => ({
  accountNumber: '',
  type: 'ACTIVE',
  toAccountNumber: '',
  parcelNumber: '',
  legalDescription: '',
  taxLot: '',
  subdivision: '',
  waterRightAcres: '',
  transactionDate: '',
  memo: '',
})

function NewTransactionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [patrons, setPatrons] = useState<Patron[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Items list — start with one empty item
  const [items, setItems] = useState<TransactionItemForm[]>([emptyItem()])

  useEffect(() => {
    fetchPatrons()
  }, [])

  useEffect(() => {
    const accountNumber = searchParams.get('accountNumber')
    if (accountNumber) {
      setItems(prev => prev.map((item, i) => i === 0 ? { ...item, accountNumber } : item))
    }
  }, [searchParams])

  const fetchPatrons = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/patrons', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch patrons')
      const data = await response.json()
      setPatrons(data)
    } catch (err) {
      setError('Error loading patrons')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (index: number, field: keyof TransactionItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (items.length === 0 || items.some(item => !item.accountNumber)) {
        setError('Please select a patron for each item')
        setSubmitting(false)
        return
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create transaction')
      }

      const transaction = await response.json()

      // Navigate back to the originating patron if one was passed
      const accountNumber = searchParams.get('accountNumber')
      if (accountNumber) {
        const patron = patrons.find(p => p.accountNumber === accountNumber)
        if (patron) {
          router.push(`/admin/patrons/${patron.id}`)
          return
        }
      }
      router.push('/admin/transactions')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderItemFields = (
    item: TransactionItemForm,
    index: number
  ) => (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Item {index + 1}</h3>
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select
            value={item.type}
            onChange={e => updateItem(index, 'type', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="TRANSFER">Transfer</option>
            <option value="CANCEL">Cancel</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patron *</label>
          <select
            value={item.accountNumber}
            onChange={e => updateItem(index, 'accountNumber', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a patron</option>
            {patrons.map(p => (
              <option key={p.accountNumber} value={p.accountNumber}>
                {p.firstName} {p.lastName} ({p.accountNumber})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
          <select
            value={item.toAccountNumber}
            onChange={e => updateItem(index, 'toAccountNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">None</option>
            {patrons.filter(p => p.accountNumber !== item.accountNumber).map(p => (
              <option key={p.accountNumber} value={p.accountNumber}>
                {p.firstName} {p.lastName} ({p.accountNumber})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parcel Number</label>
          <input
            type="text"
            maxLength={25}
            value={item.parcelNumber}
            onChange={e => updateItem(index, 'parcelNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub-division</label>
          <input
            type="text"
            maxLength={25}
            value={item.subdivision}
            onChange={e => updateItem(index, 'subdivision', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Lot</label>
          <input
            type="text"
            maxLength={255}
            value={item.taxLot}
            onChange={e => updateItem(index, 'taxLot', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Water Right Acres</label>
          <input
            type="number"
            step="0.01"
            value={item.waterRightAcres}
            onChange={e => updateItem(index, 'waterRightAcres', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
          <input
            type="date"
            value={item.transactionDate}
            onChange={e => updateItem(index, 'transactionDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Legal Description</label>
        <textarea
          maxLength={255}
          rows={2}
          value={item.legalDescription}
          onChange={e => updateItem(index, 'legalDescription', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Memo</label>
        <textarea
          rows={2}
          value={item.memo}
          onChange={e => updateItem(index, 'memo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  )

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
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">New Transaction</h2>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {items.map((item, index) => renderItemFields(item, index))}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full border-2 border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg hover:border-primary-400 hover:text-primary-600 transition text-sm"
                >
                  + Add Another Item
                </button>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    }>
      <NewTransactionPageContent />
    </Suspense>
  )
}
