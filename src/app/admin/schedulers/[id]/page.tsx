'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'
import AddSchedulerNoteModal from '@/components/AddSchedulerNoteModal'
import AddSchedulerDocumentModal from '@/components/AddSchedulerDocumentModal'

type Note = { id: string; timeReceived: string; notes: string; creator?: { firstName: string; lastName: string } | null }
type Document = { id: string; documentType: string; fileName: string; s3Url: string; description?: string | null; uploadedBy: string; createdAt: string }
type Scheduler = { id: string; scheduleId: number; scheduledTime: string; type: string; status: string; description: string; notes: Note[]; documents: Document[] }
const label = (value: string) => value.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

export default function SchedulerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [item, setItem] = useState<Scheduler | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)

  const load = async () => { try { const response = await fetch(`/api/admin/schedulers/${params.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); if (!response.ok) throw new Error('Failed to fetch activity'); setItem(await response.json()) } catch (err: any) { setError(err.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [params.id])
  const remove = async () => { if (!confirm('Are you sure you want to delete this scheduled activity?')) return; const response = await fetch(`/api/admin/schedulers/${params.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); if (response.ok) router.push('/admin/schedulers'); else setError('Failed to delete activity') }

  if (loading) return <div className="min-h-screen bg-gray-100 flex"><AdminSidebar /><div className="flex-1 flex items-center justify-center">Loading scheduled activity...</div></div>
  if (!item) return <div className="min-h-screen bg-gray-100 flex"><AdminSidebar /><div className="flex-1 p-8"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error || 'Scheduled activity not found'}</div></div></div>

  return <div className="min-h-screen bg-gray-100 flex"><AdminSidebar /><div className="flex-1 flex flex-col"><header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">Scheduled Activity Details</h2><div className="flex gap-2"><button onClick={() => router.push(`/admin/schedulers/${item.id}/edit`)} className="sf-btn sf-btn-primary">Edit</button><button onClick={remove} className="sf-btn bg-red-600 text-white hover:bg-red-700">Delete</button></div></header><main className="flex-1 p-4"><div className="space-y-3">{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}<div className="sf-card"><div className="sf-card-header">Basic Information</div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><p className="sf-field-label">Schedule ID</p><p className="sf-field-value">{item.scheduleId}</p></div><div><p className="sf-field-label">Scheduled Time</p><p className="sf-field-value">{new Date(item.scheduledTime).toLocaleString()}</p></div><div><p className="sf-field-label">Type</p><p className="sf-field-value">{label(item.type)}</p></div><div><p className="sf-field-label">Status</p><p className="sf-field-value">{label(item.status)}</p></div><div className="md:col-span-2"><p className="sf-field-label">Description</p><p className="sf-field-value whitespace-pre-wrap">{item.description}</p></div></div></div><WindowShade title={`Notes (${item.notes.length})`} defaultOpen={false} actionButton={<button className="sf-btn sf-btn-secondary text-xs" onClick={() => setShowNoteModal(true)}>New Note</button>}>{item.notes.length ? <table className="sf-table"><thead><tr><th>Date</th><th>Created By</th><th>Note</th></tr></thead><tbody>{item.notes.map((note) => <tr key={note.id}><td className="text-xs">{new Date(note.timeReceived).toLocaleString()}</td><td className="text-xs">{note.creator ? `${note.creator.firstName} ${note.creator.lastName}` : '-'}</td><td>{note.notes.length > 100 ? `${note.notes.substring(0, 100)}...` : note.notes}</td></tr>)}</tbody></table> : <p className="sf-field-value text-gray-500 text-center py-2">No notes yet</p>}</WindowShade><WindowShade title={`Documents (${item.documents.length})`} defaultOpen={false} actionButton={<button className="sf-btn sf-btn-secondary text-xs" onClick={() => setShowDocumentModal(true)}>Upload Document</button>}>{item.documents.length ? <table className="sf-table"><thead><tr><th>File Name</th><th>Doc Type</th><th>Description</th><th>Uploaded By</th><th>Date</th></tr></thead><tbody>{item.documents.map((doc) => <tr key={doc.id}><td><a href={doc.s3Url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">{doc.fileName}</a></td><td>{label(doc.documentType)}</td><td>{doc.description || '-'}</td><td>{doc.uploadedBy}</td><td className="text-xs">{new Date(doc.createdAt).toLocaleString()}</td></tr>)}</tbody></table> : <p className="sf-field-value text-gray-500 text-center py-2">No documents uploaded yet</p>}</WindowShade></div></main></div><AddSchedulerNoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} schedulerId={item.id} onNoteAdded={load} /><AddSchedulerDocumentModal isOpen={showDocumentModal} onClose={() => setShowDocumentModal(false)} schedulerId={item.id} onDocumentAdded={load} /></div>
}
