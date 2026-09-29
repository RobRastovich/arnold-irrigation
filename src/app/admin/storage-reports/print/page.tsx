'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AGREEMENT_DISCLAIMER, districtLabel, priorityLabel, reservoirLabel } from '@/lib/storage-report/constants'

function fmt(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return ''
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function iso(value: string) {
  return String(value).slice(0, 10)
}

function StorageReportsPrintContent() {
  const searchParams = useSearchParams()
  const [reports, setReports] = useState<any[]>([])
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewName, setViewName] = useState('')
  const searchTerm = searchParams.get('search') || ''
  const viewId = searchParams.get('viewId') || ''
  const id = searchParams.get('id') || ''

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token')
        if (id) {
          const res = await fetch(`/api/admin/storage-reports/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) setDetail(await res.json())
          return
        }
        const res = await fetch('/api/admin/storage-reports', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        let data = await res.json()
        if (viewId) {
          const viewRes = await fetch(`/api/admin/list-views/${viewId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (viewRes.ok) {
            const view = await viewRes.json()
            setViewName(view.name)
            const filters = view.filters || []
            if (filters.length) {
              data = data.filter((item: any) =>
                filters.every((f: any) => {
                  const val = String(item[f.field] ?? '')
                  switch (f.operator) {
                    case 'equals': return val.toLowerCase() === f.value.toLowerCase()
                    case 'contains': return val.toLowerCase().includes(f.value.toLowerCase())
                    default: return true
                  }
                })
              )
            }
          }
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          data = data.filter((r: any) =>
            String(r.waterYear).includes(term) || (r.period || '').toLowerCase().includes(term)
          )
        }
        setReports(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading) setTimeout(() => window.print(), 400)
  }, [loading])

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}><p>Preparing print view...</p></div>
  }

  const page = detail?.result
  const filterSummary = [viewName && `View: ${viewName}`, searchTerm && `Search: "${searchTerm}"`].filter(Boolean).join('  ·  ')

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #fff; color: #000; font-family: Arial, sans-serif; font-size: 11px; }
        .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #f3f4f6; border-bottom: 1px solid #d1d5db; padding: 10px 16px; display: flex; gap: 8px; align-items: center; z-index: 100; }
        .toolbar button { padding: 6px 14px; border: 1px solid #9ca3af; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; background: #fff; }
        .content { padding: 56px 24px 24px; }
        .report-header { margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #000; }
        .report-header h1 { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { border: 1px solid #000; padding: 5px 7px; font-size: 10px; text-transform: uppercase; text-align: left; background: #000; color: #fff; }
        td { border: 1px solid #555; padding: 4px 7px; }
        .page-break { page-break-before: always; }
        .disclaimer { font-size: 9px; color: #444; margin-top: 12px; }
        @media print {
          @page { margin: 0.6in; size: landscape; }
          .toolbar { display: none !important; }
          .content { padding: 0; }
          th { background: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="toolbar">
        <button onClick={() => window.close()}>✕ Close</button>
        <button onClick={() => window.print()}>🖨 Print / Save PDF</button>
        {filterSummary && <span>{filterSummary}</span>}
      </div>
      <div className="content">
        {!detail && (
          <>
            <div className="report-header">
              <h1>Arnold Irrigation District — Deschutes Storage Reports</h1>
              <p>{new Date().toLocaleDateString()}{filterSummary && ` · ${filterSummary}`} · {reports.length} report{reports.length !== 1 ? 's' : ''}</p>
            </div>
            <table>
              <thead>
                <tr><th>Water year</th><th>Period</th><th>Status</th><th>Quality</th><th>Reconciled</th></tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.waterYear}</td>
                    <td>{r.period}</td>
                    <td>{r.status}</td>
                    <td>{r.dataQuality}</td>
                    <td>{r.reconciled ? 'Within 1 AF' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {detail && (
          <>
            <div className="report-header">
              <h1>Deschutes Basin Storage Report · page 1 of 3</h1>
              <p>{iso(detail.startDate)} to {iso(detail.endDate)} · {detail.dataQuality === 'CORRECTED' ? 'Corrected' : 'Provisional'}</p>
            </div>
            {page?.page1 ? (
              <table>
                <tbody>
                  <tr><td>Natural flow at Bend</td><td>{fmt(page.page1.naturalFlowAtBendAf)} AF</td><td>{fmt(page.page1.naturalFlowAtBendCfs)} cfs</td></tr>
                  <tr><td>Total flow at Benham</td><td>{fmt(page.page1.totalFlowAtBenhamAf)} AF</td><td></td></tr>
                  <tr><td>Total flow at Bend</td><td>{fmt(page.page1.totalFlowAtBendAf)} AF</td><td>{(page.page1.percentReachingBend * 100).toFixed(2)}% reaching Bend</td></tr>
                  <tr><td>CP loss chargeable to storage</td><td>{fmt(page.page1.cranePrairieLossChargeableAf)} AF</td><td></td></tr>
                  <tr><td>Wickiup evap loss</td><td>{fmt(page.page1.wickiupEvapLossAf)} AF</td><td></td></tr>
                </tbody>
              </table>
            ) : <p>Run the report before printing results.</p>}

            <div className="page-break report-header">
              <h1>Deschutes Basin Storage Report · page 2 of 3</h1>
            </div>
            {page?.page2 && (
              <table>
                <thead><tr><th>User</th><th>Max right</th><th>Diverted</th><th>NF used</th><th>Storage used</th></tr></thead>
                <tbody>
                  {page.page2.rows.map((row: any) => (
                    <tr key={row.user}>
                      <td>{priorityLabel(row.user, row.user)}</td>
                      <td>{fmt(row.maxRightAf)}</td>
                      <td>{fmt(row.divertedAf)}</td>
                      <td>{fmt(row.natUsedAf)}</td>
                      <td>{fmt(row.storageUsedAf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="page-break report-header">
              <h1>Deschutes Basin Storage Report · page 3 of 3</h1>
            </div>
            {page?.page3 && (['cranePrairie', 'wickiup', 'crescent'] as const).map((key) => {
              const block = page.page3[key]
              return (
                <div key={key}>
                  <p style={{ fontWeight: 700, marginBottom: 6 }}>{reservoirLabel(block.reservoir)}</p>
                  <table>
                    <thead><tr><th>District</th><th>Prior</th><th>Used</th><th>Loss</th><th>Ending</th></tr></thead>
                    <tbody>
                      {block.rows.map((row: any) => (
                        <tr key={row.district}>
                          <td>{districtLabel(row.district, row.district)}</td>
                          <td>{fmt(row.priorAf)}</td>
                          <td>{fmt(row.storageUsedAf)}</td>
                          <td>{fmt(row.lossAf)}</td>
                          <td>{fmt(row.endingAf)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p>Physical {fmt(block.physicalEndingAf)} · Diff {fmt(block.accountingDiffAf)}</p>
                </div>
              )
            })}
            {page?.page3?.pumps && (
              <p>Crooked River demand {fmt(page.page3.pumps.crookedRiverDemandAf)} AF · pumped {fmt(page.page3.pumps.ytdPumpedAf)} AF</p>
            )}
            <p className="disclaimer">{AGREEMENT_DISCLAIMER}</p>
          </>
        )}
      </div>
    </>
  )
}

export default function StorageReportsPrintPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}><p>Preparing print view...</p></div>}>
      <StorageReportsPrintContent />
    </Suspense>
  )
}
