'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { FEATURE_CATALOG, featureKeyForPath, firstAllowedHref } from '@/lib/features'

interface AdminFeatureContextValue {
  featureKeys: string[]
  role: string | null
  loading: boolean
  refreshFeatures: () => Promise<void>
  hasFeature: (key: string) => boolean
}

const AdminFeatureContext = createContext<AdminFeatureContextValue>({
  featureKeys: [],
  role: null,
  loading: true,
  refreshFeatures: async () => {},
  hasFeature: () => false,
})

export function useAdminFeatures() {
  return useContext(AdminFeatureContext)
}

export function AdminFeatureProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [featureKeys, setFeatureKeys] = useState<string[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshFeatures = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setFeatureKeys([])
      setRole(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/me/features', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        setFeatureKeys([])
        setRole(null)
        return
      }
      const data = await response.json()
      setFeatureKeys(data.featureKeys || [])
      setRole(data.role || null)
    } catch (error) {
      console.error('Error fetching features:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pathname.startsWith('/admin/login')) {
      setLoading(false)
      return
    }
    refreshFeatures()
  }, [pathname])

  useEffect(() => {
    if (loading || pathname.startsWith('/admin/login')) return

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    const required = featureKeyForPath(pathname)
    if (!required) return
    if (required === 'features') {
      if (role !== 'ADMIN') router.push(firstAllowedHref(featureKeys, false))
      return
    }
    if (!featureKeys.includes(required)) {
      router.push(firstAllowedHref(featureKeys, role === 'ADMIN'))
    }
  }, [loading, pathname, featureKeys, role, router])

  const hasFeature = (key: string) => {
    if (key === 'features') return role === 'ADMIN'
    return featureKeys.includes(key)
  }

  return (
    <AdminFeatureContext.Provider value={{ featureKeys, role, loading, refreshFeatures, hasFeature }}>
      {children}
    </AdminFeatureContext.Provider>
  )
}

export function visibleAdminMenuItems(featureKeys: string[], role: string | null) {
  const items = [
    { name: 'Dashboard', icon: '📊', href: '/admin/dashboard', key: 'dashboard' },
    ...FEATURE_CATALOG.filter((feature) => {
      if (feature.key === 'users' && role !== 'ADMIN') return false
      return featureKeys.includes(feature.key)
    }).map((feature) => ({
      name: feature.name,
      icon: feature.icon,
      href: feature.href,
      key: feature.key,
    })),
  ]

  if (role === 'ADMIN') {
    items.push({ name: 'Features', icon: '⚙️', href: '/admin/features', key: 'features' })
  }

  return items
}
