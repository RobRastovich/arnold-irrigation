'use client'

import { AdminFeatureProvider } from '@/components/AdminFeatureContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFeatureProvider>{children}</AdminFeatureProvider>
}
