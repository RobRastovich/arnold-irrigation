'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import RichTextEditor from '@/components/RichTextEditor'

interface PageFormData {
  title: string
  slug: string
  content: string
  status: 'DRAFT' | 'PUBLISHED'
  metaTitle: string
  metaDesc: string
}

interface PageEditorFormProps {
  initialData?: Partial<PageFormData>
  pageId?: string
  mode: 'new' | 'edit'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function PageEditorForm({ initialData, pageId, mode }: PageEditorFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<PageFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    status: initialData?.status || 'DRAFT',
    metaTitle: initialData?.metaTitle || '',
    metaDesc: initialData?.metaDesc || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit')

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : slugify(title),
    }))
  }

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true)
    setForm((prev) => ({ ...prev, slug: slug.replace(/\s/g, '-') }))
  }

  const handleContentChange = useCallback((content: string) => {
    setForm((prev) => ({ ...prev, content }))
  }, [])

  const handleSave = async (statusOverride?: 'DRAFT' | 'PUBLISHED') => {
    setSaving(true)
    setError(null)
    const payload = { ...form, status: statusOverride || form.status }

    try {
      const token = localStorage.getItem('token')
      const url = mode === 'edit' ? `/api/admin/pages/${pageId}` : '/api/admin/pages'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save page')
      }

      router.push('/admin/pages')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'new' ? 'New Page' : `Edit: ${form.title || 'Page'}`}
            </h2>
            {form.slug && (
              <p className="text-sm text-gray-500 mt-0.5">
                URL: <span className="font-mono">/{form.slug}</span>
                {form.status === 'PUBLISHED' && (
                  <a
                    href={`/${form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary-600 hover:underline"
                  >
                    View ↗
                  </a>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/pages')}
              className="sf-btn sf-btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              className="sf-btn sf-btn-secondary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              className="sf-btn sf-btn-primary"
              disabled={saving}
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="sf-input w-full text-lg"
                    placeholder="Enter page title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug *
                    <span className="ml-1 text-gray-400 font-normal text-xs">(auto-generated from title)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">/</span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="sf-input flex-1 font-mono text-sm"
                      placeholder="page-url-slug"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <RichTextEditor
                  content={form.content}
                  onChange={handleContentChange}
                  placeholder="Start writing your page content..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="DRAFT"
                      checked={form.status === 'DRAFT'}
                      onChange={() => setForm((p) => ({ ...p, status: 'DRAFT' }))}
                      className="text-primary-600"
                    />
                    <span className="text-sm">
                      <span className="font-medium">Draft</span>
                      <span className="block text-xs text-gray-500">Only visible to admins</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="PUBLISHED"
                      checked={form.status === 'PUBLISHED'}
                      onChange={() => setForm((p) => ({ ...p, status: 'PUBLISHED' }))}
                      className="text-primary-600"
                    />
                    <span className="text-sm">
                      <span className="font-medium">Published</span>
                      <span className="block text-xs text-gray-500">Visible on the public website</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">SEO</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={form.metaTitle}
                      onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                      className="sf-input w-full text-sm"
                      placeholder={form.title || 'Meta title...'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                    <textarea
                      value={form.metaDesc}
                      onChange={(e) => setForm((p) => ({ ...p, metaDesc: e.target.value }))}
                      className="sf-input w-full text-sm"
                      rows={3}
                      placeholder="Brief description for search engines..."
                    />
                  </div>
                </div>
              </div>

              {/* Save actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSave('PUBLISHED')}
                  className="sf-btn sf-btn-primary w-full"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '✓ Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('DRAFT')}
                  className="sf-btn sf-btn-secondary w-full"
                  disabled={saving}
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
