'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

const STATUS_OPTIONS = ['DRAFT', 'SENT', 'PAID', 'VOID']
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  VOID: 'bg-red-100 text-red-600',
}
const CHARGE_TYPE_LABELS: Record<string, string> = {
  TAXLOT: 'Tax Lot',
  ACRE_OF_WATER: 'Acre of Water',
  PER_SEASON: 'Per Season',
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  useEffect(() => { fetchInvoice() }, [params.id])

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/invoices/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Invoice not found')
      const data = await res.json()
      setInvoice(data)
      setEditStatus(data.status)
      setEditNotes(data.notes || '')
      setEditDueDate(data.dueDate ? data.dueDate.split('T')[0] : '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes || null,
          dueDate: editDueDate || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setInvoice(await res.json())
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => window.print()

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

  const billToStreet = invoice.mailingStreet || invoice.serviceStreet
  const billToCity = invoice.mailingCity || invoice.serviceCity
  const billToState = invoice.mailingState || invoice.serviceState
  const billToZip = invoice.mailingZip || invoice.serviceZip

  return (
    <div className="min-h-screen bg-gray-100 flex print:bg-white">
      <div className="print:hidden">
        <AdminSidebar />
      </div>
      <main className="flex-1 p-8 print:p-0">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Screen-only controls */}
          <div className="print:hidden flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/invoices')} className="text-gray-500 hover:text-gray-700 text-sm">
                ← Invoices
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[invoice.status]}`}>
                {invoice.status}
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePrint} className="sf-btn sf-btn-secondary text-sm">🖨 Print</button>
            </div>
          </div>

          {/* Edit panel (screen only) */}
          <div className="print:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Invoice Settings</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="sf-input w-full">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="sf-input w-full" />
              </div>
              <div className="flex items-end">
                <button onClick={handleSave} disabled={saving} className="sf-btn sf-btn-primary w-full">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="sf-input w-full" placeholder="Optional notes…" />
            </div>
          </div>

          {/* Printable Invoice */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0 print:rounded-none">

            {/* Invoice header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">INVOICE</h2>
                <p className="text-gray-500 text-sm">Arnold Irrigation District</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                {invoice.dueDate && (
                  <p className="text-sm text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                )}
                <p className="text-sm text-gray-500">Rate Year: {invoice.rate?.year}</p>
              </div>
            </div>

            {/* Bill to */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg print:bg-white print:border print:border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
              <p className="font-semibold text-gray-900">{invoice.firstName} {invoice.lastName}</p>
              <p className="text-sm text-gray-600">Account: {invoice.accountNumber}</p>
              {billToStreet && <p className="text-sm text-gray-600 mt-1">{billToStreet}</p>}
              {billToCity && <p className="text-sm text-gray-600">{billToCity}, {billToState} {billToZip}</p>}
            </div>

            {/* Line items */}
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Rate Code</th>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">Unit Price</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems?.map((li: any) => (
                  <tr key={li.id} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-sm">{li.rateCode}</td>
                    <td className="py-2 text-sm">{li.description}</td>
                    <td className="py-2 text-sm text-gray-500">{CHARGE_TYPE_LABELS[li.chargeType] ?? li.chargeType}</td>
                    <td className="py-2 text-right text-sm font-mono">{Number(li.quantity).toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                    <td className="py-2 text-right text-sm font-mono">${Number(li.unitPrice).toFixed(2)}</td>
                    <td className="py-2 text-right text-sm font-mono font-medium">${Number(li.lineTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={5} className="pt-3 text-right font-bold text-gray-900 pr-4">Total Due</td>
                  <td className="pt-3 text-right font-bold text-lg text-gray-900 font-mono">
                    ${Number(invoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
