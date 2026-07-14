'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import ListViewModal from '@/components/ListViewModal'
import { nextSortConfig, sortItems, SortConfig } from '@/lib/sort-utils'

type Scheduler = { id: string; scheduleId: number; scheduledTime: string; type: string; status: string; description: string }
const columns = [{ id: 'scheduleId', label: 'Schedule ID' }, { id: 'scheduledTime', label: 'Scheduled Time' }, { id: 'type', label: 'Type' }, { id: 'status', label: 'Status' }, { id: 'description', label: 'Description' }]
const label = (value: string) => value.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

export default function SchedulersPage() {
  const [items, setItems] = useState<Scheduler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [listViews, setListViews] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<any>(null)
  const [editingView, setEditingView] = useState<any>(null)
  const [showListViewModal, setShowListViewModal] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'scheduledTime', direction: 'asc' })

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/schedulers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (!response.ok) throw new Error('Failed to fetch activities')
      setItems(await response.json())
    } catch (err) { setError('Error loading scheduled activities'); console.error(err) } finally { setLoading(false) }
  }
  const fetchListViews = async (selectDefault = false) => {
    const response = await fetch('/api/admin/list-views?entityType=scheduler', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    if (response.ok) { const data = await response.json(); setListViews(data); if (selectDefault) setSelectedView(data.find((view: any) => view.isDefault) || null) }
  }
  useEffect(() => { fetchItems(); fetchListViews(true) }, [])

  const applyFilters = (values: Scheduler[], filters: any[]) => values.filter((item) => filters.every((filter) => {
    if (!filter.field || filter.value === '') return true
    const value = filter.field === 'scheduledTime' ? new Date(item.scheduledTime).toLocaleString() : String(item[filter.field as keyof Scheduler] ?? '')
    const target = filter.value.toLowerCase()
    switch (filter.operator) { case 'equals': return value.toLowerCase() === target; case 'not_equals': return value.toLowerCase() !== target; case 'contains': return value.toLowerCase().includes(target); case 'not_contains': return !value.toLowerCase().includes(target); case 'greater_than': return Number(value) > Number(filter.value); case 'less_than': return Number(value) < Number(filter.value); case 'greater_equal': return Number(value) >= Number(filter.value); case 'less_equal': return Number(value) <= Number(filter.value); default: return true }
  }))
  const visibleColumns = selectedView?.columns || columns.map((column) => column.id)
  const filteredItems = sortItems(items.filter((item) => (!selectedView?.filters?.length || applyFilters([item], selectedView.filters).length > 0) && `${item.scheduleId} ${item.type} ${item.status} ${item.description} ${new Date(item.scheduledTime).toLocaleString()}`.toLowerCase().includes(searchTerm.toLowerCase())), sortConfig)
  const saveView = async (view: { id?: string; name: string; columns: string[]; filters: any[]; isDefault: boolean }) => {
    const response = await fetch(view.id ? `/api/admin/list-views/${view.id}` : '/api/admin/list-views', { method: view.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ ...view, entityType: 'scheduler' }) })
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to save list view')
    setSelectedView(await response.json()); await fetchListViews()
  }
  const deleteView = async () => { if (!selectedView || !confirm('Are you sure you want to delete this list view?')) return; const response = await fetch(`/api/admin/list-views/${selectedView.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); if (response.ok) { setSelectedView(null); await fetchListViews() } }
  const value = (item: Scheduler, field: string) => field === 'scheduleId' ? <Link href={`/admin/schedulers/${item.id}`} className="text-blue-600 hover:text-blue-900">{item.scheduleId}</Link> : field === 'scheduledTime' ? new Date(item.scheduledTime).toLocaleString() : field === 'type' || field === 'status' ? label(item[field]) : item.description

  return <div className="min-h-screen bg-gray-100 flex"><AdminSidebar /><div className="flex-1 flex flex-col overflow-hidden"><header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">Scheduler</h2><div className="flex gap-2"><button onClick={() => { setEditingView(null); setShowListViewModal(true) }} className="sf-btn sf-btn-secondary">New List View</button><Link href="/admin/schedulers/new" className="sf-btn sf-btn-primary">+ Add Activity</Link></div></header><main className="flex-1 p-6 overflow-y-auto"><div className="bg-white rounded-lg shadow-sm border border-gray-200">{error && <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}<div className="p-4 border-b border-gray-200 flex gap-4 items-center"><select value={selectedView?.id || ''} onChange={(event) => setSelectedView(listViews.find((view) => view.id === event.target.value) || null)} className="sf-input flex-1"><option value="">All Activities (Default View)</option>{listViews.map((view) => <option key={view.id} value={view.id}>{view.name}{view.isDefault ? ' ★' : ''}</option>)}</select>{selectedView && <div className="flex gap-2"><button onClick={() => { setEditingView(selectedView); setShowListViewModal(true) }} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button><button onClick={deleteView} className="text-red-600 hover:text-red-900 text-sm">Delete</button></div>}<input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search activities..." className="sf-input flex-1" /></div>{loading ? <div className="p-8 text-center">Loading scheduled activities...</div> : <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{visibleColumns.map((field: string) => <th key={field} onClick={() => setSortConfig(nextSortConfig(sortConfig, field))} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">{columns.find((column) => column.id === field)?.label}{sortConfig.column === field && ` ${sortConfig.direction === 'asc' ? '▲' : '▼'}`}</th>)}<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="divide-y divide-gray-200">{filteredItems.length ? filteredItems.map((item) => <tr key={item.id} className="hover:bg-gray-50">{visibleColumns.map((field: string) => <td key={field} className="px-6 py-4 text-sm text-gray-900">{value(item, field)}</td>)}<td className="px-6 py-4 text-sm"><Link href={`/admin/schedulers/${item.id}/edit`} className="text-primary-600 hover:text-primary-900">Edit</Link></td></tr>) : <tr><td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-gray-500">No scheduled activities found</td></tr>}</tbody></table></div>}</div></main></div><ListViewModal isOpen={showListViewModal} onClose={() => { setShowListViewModal(false); setEditingView(null) }} entityType="scheduler" availableColumns={columns} onSave={saveView} existingView={editingView || undefined} /></div>
}
