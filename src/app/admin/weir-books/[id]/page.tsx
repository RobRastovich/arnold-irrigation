'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'
import AddWeirBookItemModal from '@/components/AddWeirBookItemModal'
import WeirBookImageUpload from '@/components/WeirBookImageUpload'

export default function WeirBookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [weirBook, setWeirBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddItemModal, setShowAddItemModal] = useState(false)

  useEffect(() => {
    fetchWeirBook()
  }, [params.id])

  const fetchWeirBook = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/weir-books/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch weir book')

      const data = await response.json()
      setWeirBook(data)
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

  if (error || !weirBook) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Weir book not found'}</p>
          <Link href="/admin/weir-books" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Weir Books
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/admin/weir-books" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Weir Books
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">
              Weir Book #{weirBook.weirNumber}
            </h2>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <div className="space-y-3">
            {/* Basic Information */}
            <div className="sf-card">
              <div className="sf-card-header">Weir Book Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="sf-field-label">Weir Number</p>
                  <p className="sf-field-value">{weirBook.weirNumber}</p>
                </div>
                <div>
                  <p className="sf-field-label">Canal</p>
                  <p className="sf-field-value">{weirBook.canal}</p>
                </div>
                <div>
                  <p className="sf-field-label">Weir Location</p>
                  <p className="sf-field-value">{weirBook.weirLocation}</p>
                </div>
                <div>
                  <p className="sf-field-label">Created</p>
                  <p className="sf-field-value">{new Date(weirBook.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="sf-field-label">Total Items</p>
                  <p className="sf-field-value">{weirBook.items?.length ?? 0}</p>
                </div>
                <div>
                  <p className="sf-field-label">Total Acres</p>
                  <p className="sf-field-value">
                    {(weirBook.items ?? []).reduce((sum: number, i: any) => sum + i.acres, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items related list */}
            <WindowShade
              title={`Weir Book Items (${weirBook.items?.length ?? 0})`}
              defaultOpen={true}
              actionButton={
                <button
                  className="sf-btn sf-btn-secondary text-xs"
                  onClick={() => setShowAddItemModal(true)}
                >
                  Add Item
                </button>
              }
            >
              {weirBook.items?.length === 0 ? (
                <p className="sf-field-value text-gray-500 text-center py-2">No items yet</p>
              ) : (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Patron</th>
                      <th>Acres</th>
                      <th>Private Acres</th>
                      <th>Description</th>
                      <th>Notes</th>
                      <th>Photo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weirBook.items.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          {item.patron?.id ? (
                            <Link
                              href={`/admin/patrons/${item.patron.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {item.patron.firstName} {item.patron.lastName} ({item.accountNumber})
                            </Link>
                          ) : (
                            item.accountNumber
                          )}
                        </td>
                        <td>{item.acres.toFixed(2)}</td>
                        <td>{item.privateAcres.toFixed(2)}</td>
                        <td>
                          {item.description
                            ? item.description.length > 80
                              ? `${item.description.substring(0, 80)}...`
                              : item.description
                            : '-'}
                        </td>
                        <td>
                          {item.notes
                            ? item.notes.length > 80
                              ? `${item.notes.substring(0, 80)}...`
                              : item.notes
                            : '-'}
                        </td>
                        <td className="w-48">
                          <WeirBookImageUpload
                            weirBookId={params.id as string}
                            itemId={item.id}
                            currentImageUrl={item.imageUrl}
                            onUploaded={(url) => {
                              setWeirBook((prev: any) => ({
                                ...prev,
                                items: prev.items.map((i: any) =>
                                  i.id === item.id ? { ...i, imageUrl: url } : i
                                ),
                              }))
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </WindowShade>
          </div>
        </main>
      </div>

      <AddWeirBookItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        weirBookId={params.id as string}
        onItemAdded={fetchWeirBook}
      />
    </div>
  )
}
