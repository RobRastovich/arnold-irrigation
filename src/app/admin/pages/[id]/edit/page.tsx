'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PageEditorForm from '@/components/PageEditorForm'
import AdminSidebar from '@/components/AdminSidebar'

export default function EditPagePage() {
  const params = useParams()
  const id = params.id as string
  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/admin/pages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Page not found')
        const data = await res.json()
        setPageData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error || 'Page not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <PageEditorForm
      mode="edit"
      pageId={id}
      initialData={{
        title: pageData.title,
        slug: pageData.slug,
        content: pageData.content,
        status: pageData.status,
        metaTitle: pageData.metaTitle || '',
        metaDesc: pageData.metaDesc || '',
      }}
    />
  )
}
