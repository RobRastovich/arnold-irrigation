'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

export default function PatronDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [patron, setPatron] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPatron()
  }, [params.id])

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
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{patron.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Legal Name</p>
                  <p className="font-medium">{patron.legalName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{patron.firstName} {patron.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      patron.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {patron.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Primary Email</p>
                  <p className="font-medium">{patron.primaryEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Primary Phone</p>
                  <p className="font-medium">{patron.primaryPhone}</p>
                </div>
              </div>
            </div>

            {/* Service Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Address</h3>
              <div>
                <p className="font-medium">{patron.serviceStreet}</p>
                <p className="text-gray-600">
                  {patron.serviceCity}, {patron.serviceState} {patron.serviceZip}
                </p>
                <p className="text-gray-600">{patron.serviceCountry}</p>
              </div>
            </div>

            {/* Mailing Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mailing Address</h3>
              {patron.mailingStreet ? (
                <div>
                  <p className="font-medium">{patron.mailingStreet}</p>
                  <p className="text-gray-600">
                    {patron.mailingCity}, {patron.mailingState} {patron.mailingZip}
                  </p>
                  <p className="text-gray-600">{patron.mailingCountry || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-gray-500">No mailing address on file</p>
              )}
            </div>

            {/* Water Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Water Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Water Right Acres</p>
                  <p className="font-medium">{patron.totalWaterRightAcres}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assessed Acres</p>
                  <p className="font-medium">{patron.assessedAcres}</p>
                </div>
              </div>
            </div>

            {/* Account Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Notes</h3>
              {patron.notes && patron.notes.length > 0 ? (
                <div className="space-y-3">
                  {patron.notes.map((note: any) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">{note.note}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No notes</p>
              )}
            </div>

            {/* Additional Contacts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Contacts</h3>
              {patron.additionalContacts && patron.additionalContacts.length > 0 ? (
                <div className="space-y-3">
                  {patron.additionalContacts.map((contact: any) => (
                    <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="font-medium">{contact.name}</p>
                      {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
                      {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No additional contacts</p>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
              {patron.documents && patron.documents.length > 0 ? (
                <div className="space-y-3">
                  {patron.documents.map((doc: any) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-gray-600">{doc.mimeType}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(doc.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No documents</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
