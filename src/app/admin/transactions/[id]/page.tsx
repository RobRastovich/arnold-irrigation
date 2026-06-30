'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'

export default function TransactionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransaction()
  }, [params.id])

  const fetchTransaction = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/transactions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transaction')
      }

      const data = await response.json()
      setTransaction(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Transaction not found'}</p>
          <button onClick={() => router.back()} className="text-primary-600 hover:underline mt-4 inline-block">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction #{transaction.transactionNumber}
          </h2>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Back
          </button>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <div className="space-y-3">
            {/* Basic Information */}
            <div className="sf-card">
              <div className="sf-card-header">Transaction Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="sf-field-label">Transaction Number</p>
                  <p className="sf-field-value">{transaction.transactionNumber}</p>
                </div>
                <div>
                  <p className="sf-field-label">Type</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    transaction.type === 'CANCEL' ? 'bg-red-100 text-red-800' :
                    transaction.type === 'TRANSFER' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {transaction.type}
                  </span>
                </div>
                <div>
                  <p className="sf-field-label">Created</p>
                  <p className="sf-field-value">{new Date(transaction.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Transaction Items */}
            <WindowShade
              title={`Transaction Items (${transaction.items.length})`}
              defaultOpen={true}
            >
              {transaction.items.length === 0 ? (
                <p className="sf-field-value text-gray-500 text-center py-2">No items</p>
              ) : (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Patron</th>
                      <th>Parcel #</th>
                      <th>Water Right Acres</th>
                      <th>Tax Lot</th>
                      <th>Sub-division</th>
                      <th>Transaction Date</th>
                      <th>Legal Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          {item.patron?.id ? (
                            <Link
                              href={`/admin/patrons/${item.patron.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {(item.patron.firstName || item.patron.lastName)
                                ? `${item.patron.firstName || ''} ${item.patron.lastName || ''}`.trim()
                                : item.patron.legalName || item.accountNumber} ({item.accountNumber})
                            </Link>
                          ) : (
                            item.accountNumber
                          )}
                        </td>
                        <td>{item.parcelNumber || '-'}</td>
                        <td>{item.waterRightAcres != null ? item.waterRightAcres.toFixed(2) : '-'}</td>
                        <td>{item.taxLot || '-'}</td>
                        <td>{item.subdivision || '-'}</td>
                        <td className="text-xs">
                          {item.transactionDate
                            ? new Date(item.transactionDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>{item.legalDescription || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </WindowShade>
          </div>
        </main>
      </div>
    </div>
  )
}
