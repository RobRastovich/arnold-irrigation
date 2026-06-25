'use client'

import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import RateForm from '@/components/RateForm'

export default function NewRatePage() {
  const router = useRouter()

  const handleSave = async (data: any) => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to create rate')
    }
    const created = await res.json()
    router.push(`/admin/rates/${created.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">New Rate</h1>
          </div>
          <RateForm onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}
