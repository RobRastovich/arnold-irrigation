'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

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

export default function RatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/rates', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setRates(await response.json())
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = rates.filter((r) =>
    r.rateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.year).includes(searchTerm)
  )

  const fmt = (val: any) =>
    val !== null && val !== undefined ? Number(val).toFixed(2) : '—'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rates</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} rate{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/admin/rates/new" className="sf-btn sf-btn-primary">
            + New Rate
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <input
            type="text"
            placeholder="Search by rate code or year…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sf-input w-full max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-16 text-gray-500">
              {searchTerm ? 'No rates match your search.' : 'No rates yet. Click "+ New Rate" to add one.'}
            </div>
          ) : (
            <table className="sf-table w-full">
              <thead>
                <tr>
                  <th className="text-left whitespace-nowrap">Rate Code</th>
                  <th className="text-left whitespace-nowrap">Year</th>
                  {DECIMAL_FIELDS.map((f) => (
                    <th key={f.id} className="text-right whitespace-nowrap">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="font-medium">
                      <Link href={`/admin/rates/${rate.id}`} className="text-blue-600 hover:text-blue-900">
                        {rate.rateCode}
                      </Link>
                    </td>
                    <td>{rate.year}</td>
                    {DECIMAL_FIELDS.map((f) => (
                      <td key={f.id} className="text-right font-mono text-sm">
                        {fmt(rate[f.id])}
                      </td>
                    ))}
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
