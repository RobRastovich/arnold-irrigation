'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'

interface CmsPage {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED'
  updatedBy: string
  updatedAt: string
}

export default function PagesAdminPage() {
  const router = useRouter()
  const [pages, setPages] = useState<CmsPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/pages', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch pages')
      const data = await res.json()
      setPages(data)
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete page "${title}"? This cannot be undone.`)) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('Error deleting page:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">CMS Pages</h2>
          <Link href="/admin/pages/new" className="sf-btn sf-btn-primary">
            + New Page
          </Link>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading pages...</p>
              </div>
            ) : pages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No pages yet</p>
                <p className="mb-4">Create your first page to get started.</p>
                <Link href="/admin/pages/new" className="sf-btn sf-btn-primary">
                  + New Page
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {page.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          /{page.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              page.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {page.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {page.updatedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(page.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-3">
                          {page.status === 'PUBLISHED' && (
                            <a
                              href={`/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-700"
                            >
                              View ↗
                            </a>
                          )}
                          <Link
                            href={`/admin/pages/${page.id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(page.id, page.title)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
