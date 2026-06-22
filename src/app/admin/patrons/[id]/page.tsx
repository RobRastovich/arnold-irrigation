'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import WindowShade from '@/components/WindowShade'
import AddContactModal from '@/components/AddContactModal'
import AddNoteModal from '@/components/AddNoteModal'

export default function PatronDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [patron, setPatron] = useState<any>(null)
  const [turnouts, setTurnouts] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [showNoteDetailModal, setShowNoteDetailModal] = useState(false)
  const [transactionItems, setTransactionItems] = useState<any[]>([])

  useEffect(() => {
    fetchPatron()
  }, [params.id])

  useEffect(() => {
    if (patron) {
      fetchTurnouts()
      fetchNotes()
      fetchTransactionItems()
    }
  }, [patron])

  const fetchPatron = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/patrons/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patron')
      }

      const data = await response.json()
      setPatron(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTurnouts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/turnouts?accountNumber=${patron?.accountNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTurnouts(data)
      }
    } catch (err) {
      console.error('Error fetching turnouts:', err)
    }
  }

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/patrons/${params.id}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (err) {
      console.error('Error fetching notes:', err)
    }
  }

  const fetchTransactionItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/patrons/${params.id}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTransactionItems(data)
      }
    } catch (err) {
      console.error('Error fetching transaction items:', err)
    }
  }

  const handleContactAdded = () => {
    fetchPatron()
  }

  const handleNoteAdded = () => {
    fetchNotes()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !patron) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Patron not found'}</p>
          <Link href="/admin/patrons" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Patrons
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Patron Details</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/patrons/${patron.id}/edit`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Edit
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="space-y-3">
            {/* Basic Information */}
            <div className="sf-card">
              <div className="sf-card-header">Basic Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="sf-field-label">Account Number</p>
                  <p className="sf-field-value">{patron.accountNumber}</p>
                </div>
                <div>
                  <p className="sf-field-label">Legal Name</p>
                  <p className="sf-field-value">{patron.legalName || 'N/A'}</p>
                </div>
                <div>
                  <p className="sf-field-label">Name</p>
                  <p className="sf-field-value">{patron.firstName} {patron.lastName}</p>
                </div>
                <div>
                  <p className="sf-field-label">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      patron.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {patron.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="sf-field-label">Primary Email</p>
                  <p className="sf-field-value">{patron.primaryEmail}</p>
                </div>
                <div>
                  <p className="sf-field-label">Primary Phone</p>
                  <p className="sf-field-value">{patron.primaryPhone}</p>
                </div>
              </div>
            </div>

            {/* Service & Mailing Address */}
            <div className="sf-card">
              <div className="sf-card-header">Addresses</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="sf-field-label">Service Address</p>
                  <p className="sf-field-value">{patron.serviceStreet}</p>
                  <p className="sf-field-value">
                    {patron.serviceCity}, {patron.serviceState} {patron.serviceZip}
                  </p>
                  <p className="sf-field-value">{patron.serviceCountry}</p>
                </div>
                <div>
                  <p className="sf-field-label">Mailing Address</p>
                  {patron.mailingStreet ? (
                    <div>
                      <p className="sf-field-value">{patron.mailingStreet}</p>
                      <p className="sf-field-value">
                        {patron.mailingCity}, {patron.mailingState} {patron.mailingZip}
                      </p>
                      <p className="sf-field-value">{patron.mailingCountry || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="sf-field-value text-gray-500">No mailing address on file</p>
                  )}
                </div>
              </div>
            </div>

            {/* Water Information */}
            <div className="sf-card">
              <div className="sf-card-header">Water Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={(() => {
                  const totalDeliveredAcres = turnouts.reduce((sum, t) => sum + t.deliveredAcres, 0)
                  const waterRightMismatch = Math.abs(patron.totalWaterRightAcres - totalDeliveredAcres) > 0.01
                  return waterRightMismatch ? 'sf-field-highlighted' : ''
                })()}>
                  <p className="sf-field-label">Total Water Right Acres</p>
                  <p className="sf-field-value">{patron.totalWaterRightAcres}</p>
                </div>
                <div className={(() => {
                  const totalAcresOwned = turnouts.reduce((sum, t) => sum + t.acresOwned, 0)
                  const assessedMismatch = Math.abs(patron.assessedAcres - totalAcresOwned) > 0.01
                  return assessedMismatch ? 'sf-field-highlighted' : ''
                })()}>
                  <p className="sf-field-label">Assessed Acres</p>
                  <p className="sf-field-value">{patron.assessedAcres}</p>
                </div>
              </div>
            </div>

            {/* Notes - Window Shade */}
            <WindowShade
              title={`Notes (${notes.length})`}
              defaultOpen={false}
              actionButton={
                <button
                  className="sf-btn sf-btn-secondary text-xs"
                  onClick={() => setShowNoteModal(true)}
                >
                  New Note
                </button>
              }
            >
              {notes.length === 0 ? (
                <p className="sf-field-value text-gray-500 text-center py-2">No notes yet</p>
              ) : (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Created By</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <tr key={note.id}>
                        <td className="text-xs">
                          {new Date(note.timeReceived).toLocaleString()}
                        </td>
                        <td className="text-xs">
                          {note.creator ? (
                            `${note.creator.firstName} ${note.creator.lastName}`
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {note.notes.length > 100
                            ? `${note.notes.substring(0, 100)}...`
                            : note.notes}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedNote(note)
                              setShowNoteDetailModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </WindowShade>

            {/* Additional Contacts - Window Shade */}
            <WindowShade
              title={`Additional Contacts (${patron.additionalContacts?.length || 0})`}
              defaultOpen={false}
              actionButton={
                <button
                  className="sf-btn sf-btn-secondary text-xs"
                  onClick={() => setShowContactModal(true)}
                >
                  New Contact
                </button>
              }
            >
              {patron.additionalContacts && patron.additionalContacts.length > 0 ? (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patron.additionalContacts.map((contact: any) => (
                      <tr key={contact.id}>
                        <td className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="capitalize">
                          {contact.contactType?.replace('_', ' ').toLowerCase() || '-'}
                        </td>
                        <td>{contact.email || '-'}</td>
                        <td>{contact.mobilePhone || '-'}</td>
                        <td>
                          {contact.street ? (
                            <>
                              {contact.street}, {contact.city} {contact.state} {contact.zip}
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="sf-field-value text-gray-500">No additional contacts</p>
              )}
            </WindowShade>

            {/* Documents - Window Shade */}
            <WindowShade
              title={`Documents (${patron.documents?.length || 0})`}
              defaultOpen={false}
            >
              {patron.documents && patron.documents.length > 0 ? (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patron.documents.map((doc: any) => (
                      <tr key={doc.id}>
                        <td className="font-medium">{doc.fileName}</td>
                        <td className="text-xs">{doc.mimeType}</td>
                        <td className="text-xs">
                          {new Date(doc.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="sf-field-value text-gray-500">No documents</p>
              )}
            </WindowShade>

            {/* Transactions - Window Shade */}
            <WindowShade
              title={`Transactions (${transactionItems.length})`}
              defaultOpen={false}
              actionButton={
                <Link
                  href={`/admin/transactions/new?accountNumber=${patron.accountNumber}`}
                  className="sf-btn sf-btn-secondary text-xs"
                >
                  New Transaction
                </Link>
              }
            >
              {transactionItems.length === 0 ? (
                <p className="sf-field-value text-gray-500 text-center py-2">No transactions</p>
              ) : (
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Transaction #</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Parcel #</th>
                      <th>Water Right Acres</th>
                      <th>Tax Lot</th>
                      <th>Legal Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionItems.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.transaction.transactionNumber}</td>
                        <td>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            item.transaction.type === 'CANCEL' ? 'bg-red-100 text-red-800' :
                            item.transaction.type === 'TRANSFER' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.transaction.type}
                          </span>
                        </td>
                        <td className="text-xs">
                          {item.transactionDate
                            ? new Date(item.transactionDate).toLocaleDateString()
                            : new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td>{item.parcelNumber || '-'}</td>
                        <td>{item.waterRightAcres != null ? item.waterRightAcres.toFixed(2) : '-'}</td>
                        <td>{item.taxLot || '-'}</td>
                        <td>
                          {item.legalDescription
                            ? item.legalDescription.length > 60
                              ? `${item.legalDescription.substring(0, 60)}...`
                              : item.legalDescription
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </WindowShade>

            {/* Turnouts - Window Shade */}
            <WindowShade
              title={`Turnouts (${turnouts.length})`}
              defaultOpen={false}
              actionButton={
                <Link
                  href={`/admin/turnouts/new?accountNumber=${patron.accountNumber}`}
                  className="sf-btn sf-btn-secondary text-xs"
                >
                  Add Turnout
                </Link>
              }
            >
              {turnouts.length > 0 ? (
                <>
                  <div className="mb-3 p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="sf-field-label">Total Delivered Acres</p>
                        <p className="sf-field-value">
                          {turnouts.reduce((sum, t) => sum + t.deliveredAcres, 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="sf-field-label">Total Acres Owned</p>
                        <p className="sf-field-value">
                          {turnouts.reduce((sum, t) => sum + t.acresOwned, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <table className="sf-table">
                    <thead>
                      <tr>
                        <th>Canal/Gate</th>
                        <th>Tax Lot</th>
                        <th>Delivered Acres</th>
                        <th>Acres Owned</th>
                        <th>Legal Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnouts.map((turnout) => (
                        <tr key={turnout.id}>
                          <td>
                            <Link
                              href={`/admin/turnouts/${turnout.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {turnout.canal} - {turnout.gate}
                            </Link>
                          </td>
                          <td>{turnout.taxLotNumber || 'N/A'}</td>
                          <td>{turnout.deliveredAcres.toFixed(2)}</td>
                          <td>{turnout.acresOwned.toFixed(2)}</td>
                          <td>{turnout.legalDescription || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="sf-field-value text-gray-500">No turnouts</p>
              )}
            </WindowShade>
          </div>
        </main>
      </div>

      <AddContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        patronId={params.id as string}
        onContactAdded={handleContactAdded}
      />
      <AddNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        patronId={params.id as string}
        onNoteAdded={handleNoteAdded}
      />
      {showNoteDetailModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Note Details</h3>
                <button
                  onClick={() => setShowNoteDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedNote.timeReceived).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-sm text-gray-900">
                    {selectedNote.creator
                      ? `${selectedNote.creator.firstName} ${selectedNote.creator.lastName}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Note</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedNote.notes}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowNoteDetailModal(false)}
                  className="sf-btn sf-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
