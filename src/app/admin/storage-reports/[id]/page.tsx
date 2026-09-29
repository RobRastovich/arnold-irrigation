'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { ACCOUNT_DISTRICTS, AGREEMENT_DISCLAIMER, DISTRICT_LABELS, RESERVOIR_LABELS, districtLabel, priorityLabel, reservoirLabel } from '@/lib/storage-report/constants'

const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'raw', label: 'Raw data' },
  { id: 'rights', label: 'Water rights' },
  { id: 'pumps', label: 'Pumps' },
  { id: 'results', label: 'Results' },
  { id: 'reconcile', label: 'Reconcile' },
]

function fmt(n?: number | null, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function iso(value: string) {
  return String(value).slice(0, 10)
}

export default function StorageReportDetailPage() {
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [gages, setGages] = useState<any>(null)
  const [tab, setTab] = useState('setup')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [overrideKey, setOverrideKey] = useState('cranePrairie.NUID.storageUsedAf')
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  const token = () => localStorage.getItem('token')

  const fetchReport = async () => {
    const response = await fetch(`/api/admin/storage-reports/${params.id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (!response.ok) throw new Error('Failed to fetch storage report')
    setReport(await response.json())
  }

  const fetchGages = async () => {
    const response = await fetch(`/api/admin/storage-reports/${params.id}/gages`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (response.ok) setGages(await response.json())
  }

  useEffect(() => {
    const load = async () => {
      try {
        await fetchReport()
        await fetchGages()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const saveReport = async (payload: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/storage-reports/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Save failed')
      }
      setReport(await response.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const run = async () => {
    setRunning(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/storage-reports/${params.id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Run failed')
      }
      await fetchReport()
      setTab('results')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const refreshGages = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/storage-reports/gages/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ startDate: iso(report.startDate), endDate: iso(report.endDate) }),
      })
      await fetchGages()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadCsv = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/storage-reports/${params.id}/gages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ csv: csvText, markCorrected: true }),
      })
      if (!response.ok) throw new Error('CSV upload failed')
      setCsvText('')
      await fetchGages()
      await fetchReport()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/admin/storage-reports" className="text-primary-600 hover:underline mt-4 inline-block">Back to Storage Reports</Link>
        </div>
      </div>
    )
  }

  const result = report.result
  const page1 = result?.page1
  const page2 = result?.page2
  const page3 = result?.page3

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/admin/storage-reports" className="text-gray-500 hover:text-gray-700 text-sm">← Storage Reports</Link>
            <h2 className="text-xl font-semibold text-gray-900">
              WY {report.waterYear} · {iso(report.startDate)} – {iso(report.endDate)}
            </h2>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100">{report.status}</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-800">
              {report.dataQuality === 'CORRECTED' ? 'Corrected' : 'Provisional'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open(`/admin/storage-reports/print?id=${report.id}`, '_blank')} className="sf-btn sf-btn-secondary">🖨 Print</button>
            <button onClick={run} disabled={running} className="sf-btn sf-btn-primary">{running ? 'Running…' : 'Run report'}</button>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === item.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 overflow-auto">
          {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

          {tab === 'setup' && (
            <div className="space-y-3">
              <div className="sf-card">
                <div className="sf-card-header">Period setup</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="sf-field-label">Start</p>
                    <input type="date" className="sf-input w-full" value={iso(report.startDate)} onChange={(e) => setReport({ ...report, startDate: e.target.value })} />
                  </div>
                  <div>
                    <p className="sf-field-label">End</p>
                    <input type="date" className="sf-input w-full" value={iso(report.endDate)} onChange={(e) => setReport({ ...report, endDate: e.target.value })} />
                  </div>
                  <div>
                    <p className="sf-field-label">Date code</p>
                    <select className="sf-input w-full" value={report.dateCode} onChange={(e) => setReport({ ...report, dateCode: Number(e.target.value) })}>
                      <option value={1}>1 — Apr / Oct</option>
                      <option value={2}>2 — Early May / late Sep</option>
                      <option value={3}>3 — May 15–Sep 14</option>
                    </select>
                  </div>
                  <div>
                    <p className="sf-field-label">Status</p>
                    <select className="sf-input w-full" value={report.status} onChange={(e) => setReport({ ...report, status: e.target.value })}>
                      <option value="DRAFT">DRAFT</option>
                      <option value="RECONCILED">RECONCILED</option>
                      <option value="FINAL">FINAL</option>
                    </select>
                  </div>
                  <div>
                    <p className="sf-field-label">Legacy CP tributary inflow</p>
                    <select className="sf-input w-full" value={String(report.useLegacyCpInflow)} onChange={(e) => setReport({ ...report, useLegacyCpInflow: e.target.value === 'true' })}>
                      <option value="true">On (match workbook)</option>
                      <option value="false">Off (phase 2 mass balance)</option>
                    </select>
                  </div>
                  <div>
                    <p className="sf-field-label">Notes</p>
                    <input className="sf-input w-full" value={report.notes || ''} onChange={(e) => setReport({ ...report, notes: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="sf-btn sf-btn-primary" disabled={saving} onClick={() => saveReport({
                    startDate: iso(report.startDate),
                    endDate: iso(report.endDate),
                    dateCode: report.dateCode,
                    status: report.status,
                    notes: report.notes,
                    useLegacyCpInflow: report.useLegacyCpInflow,
                  })}>{saving ? 'Saving…' : 'Save setup'}</button>
                </div>
              </div>

              <div className="sf-card">
                <div className="sf-card-header">Starting district balances (AF)</div>
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>District</th>
                      {Object.entries(RESERVOIR_LABELS).map(([code, label]) => <th key={code}>{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ACCOUNT_DISTRICTS.map((district) => (
                      <tr key={district}>
                        <td>{DISTRICT_LABELS[district]}</td>
                        {(['CRANE_PRAIRIE', 'WICKIUP', 'CRESCENT_LAKE'] as const).map((reservoir) => {
                          const row = report.openingBalances?.find((b: any) => b.district === district && b.reservoir === reservoir)
                          return (
                            <td key={reservoir}>
                              <input
                                className="sf-input w-28"
                                type="number"
                                step="0.01"
                                value={row?.acreFeet ?? 0}
                                onChange={(e) => {
                                  const acreFeet = Number(e.target.value)
                                  setReport({
                                    ...report,
                                    openingBalances: report.openingBalances.map((b: any) =>
                                      b.district === district && b.reservoir === reservoir ? { ...b, acreFeet } : b
                                    ),
                                  })
                                }}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="sf-btn sf-btn-secondary mt-3" disabled={saving} onClick={() => saveReport({ openingBalances: report.openingBalances })}>
                  Save balances
                </button>
              </div>
            </div>
          )}

          {tab === 'raw' && (
            <div className="space-y-3">
              <div className="sf-card">
                <div className="sf-card-header">Gage series</div>
                <p className="text-sm text-gray-600 mb-3">
                  Official reports must use corrected / shifted OWRD series. Refresh pulls provisional published daily values. Missing days are highlighted.
                </p>
                <div className="flex gap-2 mb-3">
                  <button className="sf-btn sf-btn-secondary" onClick={refreshGages} disabled={saving}>Refresh gages</button>
                </div>
                <textarea
                  className="sf-input w-full font-mono text-xs"
                  rows={4}
                  placeholder="CSV: station_nbr,record_date,mean_daily_flow_cfs,published_status"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <button className="sf-btn sf-btn-primary mt-2" onClick={uploadCsv} disabled={saving || !csvText}>Upload corrected CSV</button>
              </div>
              <div className="sf-card overflow-x-auto">
                <div className="sf-card-header">Daily grid ({gages?.missingDays ?? 0} days with gaps)</div>
                <table className="sf-table text-xs">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Arnold</th>
                      <th>COID</th>
                      <th>DCMID</th>
                      <th>NUID</th>
                      <th>North</th>
                      <th>Swalley</th>
                      <th>LP net</th>
                      <th>DEBO</th>
                      <th>Benham</th>
                      <th>CP AF</th>
                      <th>Wick AF</th>
                      <th>Cres AF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gages?.daily ?? []).map((row: any) => (
                      <tr key={row.date} className={row.missing?.length ? 'bg-amber-50' : ''}>
                        <td>{row.date}</td>
                        <td>{fmt(row.arnoldCfs)}</td>
                        <td>{fmt(row.coidCanalCfs)}</td>
                        <td>{fmt(row.dcmidCfs)}</td>
                        <td>{fmt(row.nuidCfs)}</td>
                        <td>{fmt(row.northCanalCfs)}</td>
                        <td>{fmt(row.swalleyCfs)}</td>
                        <td>{fmt(row.lonePineNetCfs)}</td>
                        <td>{fmt(row.deboCfs)}</td>
                        <td>{fmt(row.descAtBenhamCfs)}</td>
                        <td>{fmt(row.cranePrairieContentsAf, 0)}</td>
                        <td>{fmt(row.wickiupContentsAf, 0)}</td>
                        <td>{fmt(row.crescentContentsAf, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rights' && (
            <div className="space-y-3">
              <div className="sf-card">
                <div className="sf-card-header">DEBO leases / permanent ISWR (cfs)</div>
                <table className="sf-table">
                  <thead><tr><th>District</th><th>Kind</th><th>CFS / acres</th></tr></thead>
                  <tbody>
                    {(report.instreamLeases ?? []).map((row: any) => (
                      <tr key={row.id}>
                        <td>{row.district}</td>
                        <td>{row.kind}</td>
                        <td>
                          <input
                            className="sf-input w-28"
                            type="number"
                            step="0.001"
                            value={row.kind === 'DIRECT_ACRES' ? row.acres ?? 0 : row.cfs}
                            onChange={(e) => {
                              const n = Number(e.target.value)
                              setReport({
                                ...report,
                                instreamLeases: report.instreamLeases.map((l: any) =>
                                  l.id === row.id
                                    ? (row.kind === 'DIRECT_ACRES' ? { ...l, acres: n } : { ...l, cfs: n })
                                    : l
                                ),
                              })
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="sf-btn sf-btn-secondary mt-3" onClick={() => saveReport({ instreamLeases: report.instreamLeases })}>Save leases</button>
              </div>
              <div className="sf-card">
                <div className="sf-card-header">Max water-right table (cfs)</div>
                <table className="sf-table">
                  <thead>
                    <tr><th>Right</th><th>Apr</th><th>Early May</th><th>Summer</th><th>Late Sep</th><th>Oct</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      (report.waterRights ?? []).reduce((acc: any, row: any) => {
                        if (!acc[row.rightName]) acc[row.rightName] = []
                        acc[row.rightName][row.seasonIndex] = row.maxCfs
                        return acc
                      }, {})
                    ).map(([name, seasons]: any) => (
                      <tr key={name}>
                        <td>{name}</td>
                        {(seasons as number[]).map((cfs, i) => <td key={i}>{fmt(cfs, 3)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'pumps' && (
            <div className="sf-card">
              <div className="sf-card-header">NUID Crooked River pumps · WY {report.waterYear}</div>
              <table className="sf-table">
                <thead><tr><th>Month</th><th>Pumped AF</th><th>Deliveries AF</th></tr></thead>
                <tbody>
                  {(report.pumps ?? []).map((row: any) => (
                    <tr key={row.id}>
                      <td>{row.month}</td>
                      <td>
                        <input className="sf-input w-28" type="number" value={row.pumpedAf} onChange={(e) => setReport({
                          ...report,
                          pumps: report.pumps.map((p: any) => p.id === row.id ? { ...p, pumpedAf: Number(e.target.value) } : p),
                        })} />
                      </td>
                      <td>
                        <input className="sf-input w-28" type="number" value={row.deliveriesAf} onChange={(e) => setReport({
                          ...report,
                          pumps: report.pumps.map((p: any) => p.id === row.id ? { ...p, deliveriesAf: Number(e.target.value) } : p),
                        })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="sf-btn sf-btn-secondary mt-3" onClick={() => saveReport({ pumps: report.pumps })}>Save pump data</button>
            </div>
          )}

          {tab === 'results' && (
            <div className="space-y-3">
              {!page1 && <p className="text-gray-500">Run the report to see page 1–3 totals.</p>}
              {page1 && (
                <>
                  <div className="sf-card">
                    <div className="sf-card-header">Page 1 · Reservoir & natural flow</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><p className="sf-field-label">NF at Bend</p><p className="sf-field-value">{fmt(page1.naturalFlowAtBendAf)} AF</p></div>
                      <div><p className="sf-field-label">NF at Bend</p><p className="sf-field-value">{fmt(page1.naturalFlowAtBendCfs)} cfs</p></div>
                      <div><p className="sf-field-label">% reaching Bend</p><p className="sf-field-value">{(page1.percentReachingBend * 100).toFixed(2)}%</p></div>
                      <div><p className="sf-field-label">Flow at Benham</p><p className="sf-field-value">{fmt(page1.totalFlowAtBenhamAf)} AF</p></div>
                      <div><p className="sf-field-label">Flow at Bend</p><p className="sf-field-value">{fmt(page1.totalFlowAtBendAf)} AF</p></div>
                      <div><p className="sf-field-label">CP loss to storage</p><p className="sf-field-value">{fmt(page1.cranePrairieLossChargeableAf)} AF</p></div>
                    </div>
                  </div>
                  <div className="sf-card">
                    <div className="sf-card-header">Page 2 · Priority distribution</div>
                    <table className="sf-table">
                      <thead>
                        <tr><th>User</th><th>Max right</th><th>Diverted</th><th>NF used</th><th>Storage used</th><th>NF remaining</th></tr>
                      </thead>
                      <tbody>
                        {(page2?.rows ?? []).map((row: any) => (
                          <tr key={row.user}>
                            <td>{priorityLabel(row.user, row.user)}</td>
                            <td>{fmt(row.maxRightAf)}</td>
                            <td>{fmt(row.divertedAf)}</td>
                            <td>{fmt(row.natUsedAf)}</td>
                            <td>{fmt(row.storageUsedAf)}</td>
                            <td>{fmt(row.remainingNfAf)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sf-card">
                    <div className="sf-card-header">Page 3 · Storage distribution</div>
                    {(['cranePrairie', 'wickiup', 'crescent'] as const).map((key) => {
                      const block = page3?.[key]
                      if (!block) return null
                      return (
                        <div key={key} className="mb-4">
                          <p className="font-semibold mb-2">{reservoirLabel(block.reservoir, key)}</p>
                          <table className="sf-table">
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
                        </div>
                      )
                    })}
                    {page3?.pumps && (
                      <p className="text-sm text-gray-700">
                        Crooked River demand {fmt(page3.pumps.crookedRiverDemandAf)} AF · YTD pumped {fmt(page3.pumps.ytdPumpedAf)} AF · deficit {fmt(page3.pumps.deficitAf)} AF
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{AGREEMENT_DISCLAIMER}</p>
                </>
              )}
            </div>
          )}

          {tab === 'reconcile' && (
            <div className="space-y-3">
              <div className="sf-card">
                <div className="sf-card-header">Physical vs accounting</div>
                {page3 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {([
                      ['Crane Prairie', page3.cranePrairie],
                      ['Wickiup', page3.wickiup],
                      ['Crescent Lake', page3.crescent],
                    ] as const).map(([label, block]) => {
                      const warn = Math.abs(block.accountingDiffAf) > 1
                      return (
                        <div key={label} className={warn ? 'sf-field-highlighted p-2' : ''}>
                          <p className="sf-field-label">{label}</p>
                          <p className="sf-field-value">Physical {fmt(block.physicalEndingAf)}</p>
                          <p className="sf-field-value">Accounting {fmt(block.totals.endingAf)}</p>
                          <p className="sf-field-value">Diff {fmt(block.accountingDiffAf)}</p>
                          {warn && <p className="text-red-600 text-sm">|diff| &gt; 1 AF</p>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Run the report to reconcile.</p>
                )}
                <p className="text-sm mt-3">{page3?.reconciled ? 'Reconciled within 1 AF.' : 'Not yet within 1 AF.'}</p>
              </div>
              <div className="sf-card">
                <div className="sf-card-header">Storage-used overrides</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="sf-input" value={overrideKey} onChange={(e) => setOverrideKey(e.target.value)} placeholder="key" />
                  <input className="sf-input" value={overrideValue} onChange={(e) => setOverrideValue(e.target.value)} placeholder="AF" />
                  <input className="sf-input" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason (audit)" />
                </div>
                <button
                  className="sf-btn sf-btn-secondary mt-3"
                  onClick={() => saveReport({
                    overrides: [{ key: overrideKey, value: Number(overrideValue), reason: overrideReason }],
                  })}
                >
                  Save override
                </button>
                <table className="sf-table mt-3">
                  <thead><tr><th>Key</th><th>Value</th><th>Reason</th></tr></thead>
                  <tbody>
                    {(report.overrides ?? []).map((row: any) => (
                      <tr key={row.id}><td>{row.key}</td><td>{fmt(row.value)}</td><td>{row.reason || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
