'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  VOID: 'bg-red-100 text-red-600',
}

function InvoicesContent() {
  const searchParams = useSearchParams()
  const rateIdFilter = searchParams.get('rateId') || ''

  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchInvoices() }, [rateIdFilter, statusFilter])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const qs = new URLSearchParams()
      if (rateIdFilter) qs.set('rateId', rateIdFilter)
      if (statusFilter) qs.set('status', statusFilter)
      const res = await fetch(`/api/admin/invoices?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setInvoices(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = invoices.filter((inv) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      inv.invoiceNumber?.toLowerCase().includes(s) ||
      inv.accountNumber?.toLowerCase().includes(s) ||
      `${inv.firstName} ${inv.lastName}`.toLowerCase().includes(s)
    )
  })

  const totalAmount = filtered.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
              {filtered.length > 0 && ` · Total: $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </p>
          </div>
          {rateIdFilter && (
            <Link href="/admin/invoices" className="sf-btn sf-btn-secondary text-sm">
              Clear Filter
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search invoice #, account, name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sf-input w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sf-input w-40"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-16 text-gray-500">
              {search || statusFilter ? 'No invoices match your filters.' : 'No invoices yet. Generate assessments from a Rate Schedule.'}
            </div>
          ) : (
            <table className="sf-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Invoice #</th>
                  <th className="text-left">Account</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Year</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium">
                      <Link href={`/admin/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-900">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="text-sm">{inv.accountNumber}</td>
                    <td>{inv.firstName} {inv.lastName}</td>
                    <td>{inv.rate?.year}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-right font-mono text-sm">
                      ${Number(inv.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
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

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesContent />
    </Suspense>
  )
}
