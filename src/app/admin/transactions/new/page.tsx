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
  parcelNumber: string
  legalDescription: string
  taxLot: string
  subdivision: string
  waterRightAcres: string
  transactionDate: string
}

const emptyItem = (): TransactionItemForm => ({
  accountNumber: '',
  parcelNumber: '',
  legalDescription: '',
  taxLot: '',
  subdivision: '',
  waterRightAcres: '',
  transactionDate: '',
})

function NewTransactionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [patrons, setPatrons] = useState<Patron[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<'CANCEL' | 'TRANSFER' | 'ACTIVE'>('CANCEL')

  // Cancel: one item, pre-populated from query param
  const [cancelItem, setCancelItem] = useState<TransactionItemForm>(emptyItem())

  // Transfer: fromItem and toItem
  const [fromItem, setFromItem] = useState<TransactionItemForm>(emptyItem())
  const [toItem, setToItem] = useState<TransactionItemForm>(emptyItem())

  useEffect(() => {
    fetchPatrons()
  }, [])

  useEffect(() => {
    const accountNumber = searchParams.get('accountNumber')
    if (accountNumber) {
      setCancelItem(prev => ({ ...prev, accountNumber }))
      setFromItem(prev => ({ ...prev, accountNumber }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      let items: TransactionItemForm[] = []

      if (type === 'CANCEL') {
        if (!cancelItem.accountNumber) {
          setError('Please select a patron')
          setSubmitting(false)
          return
        }
        items = [cancelItem]
      } else if (type === 'TRANSFER') {
        if (!fromItem.accountNumber || !toItem.accountNumber) {
          setError('Please select both From and To patrons')
          setSubmitting(false)
          return
        }
        if (fromItem.accountNumber === toItem.accountNumber) {
          setError('From and To patrons must be different')
          setSubmitting(false)
          return
        }
        items = [fromItem, toItem]
      } else {
        items = [cancelItem]
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, items }),
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
    onChange: (field: keyof TransactionItemForm, value: string) => void,
    label: string
  ) => (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patron *</label>
        <select
          value={item.accountNumber}
          onChange={e => onChange('accountNumber', e.target.value)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parcel Number</label>
          <input
            type="text"
            maxLength={25}
            value={item.parcelNumber}
            onChange={e => onChange('parcelNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub-division</label>
          <input
            type="text"
            maxLength={25}
            value={item.subdivision}
            onChange={e => onChange('subdivision', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Lot</label>
          <input
            type="text"
            maxLength={255}
            value={item.taxLot}
            onChange={e => onChange('taxLot', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Water Right Acres</label>
          <input
            type="number"
            step="0.01"
            value={item.waterRightAcres}
            onChange={e => onChange('waterRightAcres', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
          <input
            type="date"
            value={item.transactionDate}
            onChange={e => onChange('transactionDate', e.target.value)}
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
          onChange={e => onChange('legalDescription', e.target.value)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type *
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as 'CANCEL' | 'TRANSFER' | 'ACTIVE')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CANCEL">Cancel</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>

                {type === 'TRANSFER' ? (
                  <div className="space-y-4">
                    {renderItemFields(
                      fromItem,
                      (field, value) => setFromItem(prev => ({ ...prev, [field]: value })),
                      'From Patron (Water Giver)'
                    )}
                    {renderItemFields(
                      toItem,
                      (field, value) => setToItem(prev => ({ ...prev, [field]: value })),
                      'To Patron (Water Receiver)'
                    )}
                  </div>
                ) : (
                  renderItemFields(
                    cancelItem,
                    (field, value) => setCancelItem(prev => ({ ...prev, [field]: value })),
                    'Patron'
                  )
                )}

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
