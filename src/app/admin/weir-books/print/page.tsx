'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function WeirBooksPrintContent() {
  const searchParams = useSearchParams()
  const [weirBooks, setWeirBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewName, setViewName] = useState<string>('')

  const searchTerm = searchParams.get('search') || ''
  const viewId = searchParams.get('viewId') || ''

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch weir books
      const wbRes = await fetch('/api/admin/weir-books', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!wbRes.ok) return
      let data = await wbRes.json()

      // If a saved view was active, fetch it and apply its filters
      let filters: any[] = []
      if (viewId) {
        const viewRes = await fetch(`/api/admin/list-views/${viewId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (viewRes.ok) {
          const view = await viewRes.json()
          setViewName(view.name)
          filters = view.filters || []
        }
      }

      // Apply saved view filters
      if (filters.length > 0) {
        data = data.filter((wb: any) =>
          filters.every((f: any) => {
            const val = String(wb[f.field] ?? '')
            switch (f.operator) {
              case 'equals': return val.toLowerCase() === f.value.toLowerCase()
              case 'not_equals': return val.toLowerCase() !== f.value.toLowerCase()
              case 'contains': return val.toLowerCase().includes(f.value.toLowerCase())
              case 'not_contains': return !val.toLowerCase().includes(f.value.toLowerCase())
              case 'greater_than': return Number(val) > Number(f.value)
              case 'less_than': return Number(val) < Number(f.value)
              case 'greater_equal': return Number(val) >= Number(f.value)
              case 'less_equal': return Number(val) <= Number(f.value)
              default: return true
            }
          })
        )
      }

      // Apply search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        data = data.filter((wb: any) =>
          wb.canal.toLowerCase().includes(term) ||
          String(wb.weirLocation).includes(term)
        )
      }

      setWeirBooks(data)
    } catch (err) {
      console.error('Error fetching weir books:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      setTimeout(() => window.print(), 400)
    }
  }, [loading])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <p>Preparing print view...</p>
      </div>
    )
  }

  const grandTotalAcres = weirBooks.reduce(
    (sum, wb) => sum + wb.items.reduce((s: number, i: any) => s + (i.acres ?? 0), 0), 0
  )
  const grandTotalPrivateAcres = weirBooks.reduce(
    (sum, wb) => sum + wb.items.reduce((s: number, i: any) => s + (i.privateAcres ?? 0), 0), 0
  )

  const filterSummary = [
    viewName && `View: ${viewName}`,
    searchTerm && `Search: "${searchTerm}"`,
  ].filter(Boolean).join('  ·  ')

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #fff; color: #000; font-family: Arial, sans-serif; font-size: 11px; }

        .toolbar {
          position: fixed; top: 0; left: 0; right: 0;
          background: #f3f4f6; border-bottom: 1px solid #d1d5db;
          padding: 10px 16px; display: flex; gap: 8px; align-items: center;
          z-index: 100;
        }
        .toolbar button {
          padding: 6px 14px; border: 1px solid #9ca3af; border-radius: 4px;
          cursor: pointer; font-size: 12px; font-weight: 600; background: #fff; color: #111;
        }
        .toolbar button:hover { background: #e5e7eb; }
        .toolbar .label { font-size: 11px; color: #6b7280; margin-left: 8px; }

        .content { padding: 56px 24px 24px; }

        .report-header { margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #000; }
        .report-header h1 { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
        .report-header p { font-size: 10px; color: #444; }

        table { width: 100%; border-collapse: collapse; }
        th {
          border: 1px solid #000; padding: 5px 7px;
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em;
          text-align: left; background: #000; color: #fff;
        }
        td { border: 1px solid #555; padding: 4px 7px; vertical-align: top; }

        .wb-header td {
          background: #e5e5e5; font-weight: 700;
          border-top: 2px solid #000; border-bottom: 1px solid #000;
          font-size: 12px;
        }
        .item-indent { padding-left: 20px !important; color: #666; font-size: 10px; }
        .subtotal-row td {
          background: #f0f0f0; font-weight: 700;
          border-top: 1px solid #000; font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .grand-total-row td {
          background: #000; color: #fff; font-weight: 700; font-size: 12px;
          border-top: 2px solid #000;
        }
        .no-items td { color: #888; font-style: italic; }

        @media print {
          @page { margin: 0.6in; size: landscape; }
          .toolbar { display: none !important; }
          .content { padding: 0; }
          body { font-size: 10px; }
          th { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .wb-header td { background: #e5e5e5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .subtotal-row td { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .grand-total-row td { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="toolbar">
        <button onClick={() => window.close()}>✕ Close</button>
        <button onClick={() => window.print()}>🖨 Print / Save PDF</button>
        {filterSummary && <span className="label">{filterSummary}</span>}
      </div>

      <div className="content">
        <div className="report-header">
          <h1>Arnold Irrigation District — Weir Book Report</h1>
          <p>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {filterSummary && <>&nbsp;&nbsp;·&nbsp;&nbsp;{filterSummary}</>}
            &nbsp;&nbsp;·&nbsp;&nbsp;{weirBooks.length} weir book{weirBooks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: 70 }}>Location</th>
              <th>Canal / Patron</th>
              <th style={{ width: 75 }}>Acres</th>
              <th style={{ width: 85 }}>Private Acres</th>
              <th>Description</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {weirBooks.map((wb) => {
              const totalAcres = wb.items.reduce((s: number, i: any) => s + (i.acres ?? 0), 0)
              const totalPrivate = wb.items.reduce((s: number, i: any) => s + (i.privateAcres ?? 0), 0)
              return (
                <React.Fragment key={wb.id}>
                  <tr className="wb-header">
                    <td>{wb.weirLocation}</td>
                    <td colSpan={5}>{wb.canal}</td>
                  </tr>
                  {wb.items.length === 0 ? (
                    <tr className="no-items">
                      <td colSpan={6} className="item-indent">No items</td>
                    </tr>
                  ) : (
                    <>
                      {wb.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="item-indent">↳</td>
                          <td>
                            {item.patron
                              ? `${item.patron.firstName} ${item.patron.lastName} (${item.accountNumber})`
                              : ''}
                          </td>
                          <td>{item.acres != null ? item.acres.toFixed(2) : ''}</td>
                          <td>{item.privateAcres != null ? item.privateAcres.toFixed(2) : ''}</td>
                          <td>{item.description || ''}</td>
                          <td>{item.notes || ''}</td>
                        </tr>
                      ))}
                      <tr className="subtotal-row">
                        <td colSpan={2}>Subtotal</td>
                        <td>{totalAcres.toFixed(2)}</td>
                        <td>{totalPrivate.toFixed(2)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              )
            })}
            <tr className="grand-total-row">
              <td colSpan={2}>Grand Total</td>
              <td>{grandTotalAcres.toFixed(2)}</td>
              <td>{grandTotalPrivateAcres.toFixed(2)}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function WeirBooksPrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <p>Preparing print view...</p>
      </div>
    }>
      <WeirBooksPrintContent />
    </Suspense>
  )
}
