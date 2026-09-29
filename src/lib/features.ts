export interface FeatureDefinition {
  key: string
  name: string
  href: string
  icon: string
  sortOrder: number
  pagePrefixes: string[]
  apiPrefixes: string[]
}

/** Tabs that can be turned on or off per user. Features itself is ADMIN-only and is not listed here. */
export const FEATURE_CATALOG: FeatureDefinition[] = [
  { key: 'patrons', name: 'Patrons', href: '/admin/patrons', icon: '👥', sortOrder: 20, pagePrefixes: ['/admin/patrons', '/admin/transactions'], apiPrefixes: ['/api/admin/patrons', '/api/admin/transactions'] },
  { key: 'turnouts', name: 'Turnouts', href: '/admin/turnouts', icon: '💧', sortOrder: 30, pagePrefixes: ['/admin/turnouts'], apiPrefixes: ['/api/admin/turnouts'] },
  { key: 'rates', name: 'Rates', href: '/admin/rates', icon: '💲', sortOrder: 40, pagePrefixes: ['/admin/rates', '/admin/rate-types'], apiPrefixes: ['/api/admin/rates', '/api/admin/rate-types'] },
  { key: 'invoices', name: 'Assessments', href: '/admin/invoices', icon: '🧾', sortOrder: 50, pagePrefixes: ['/admin/invoices'], apiPrefixes: ['/api/admin/invoices'] },
  { key: 'weir-books', name: 'Weir Book', href: '/admin/weir-books', icon: '📖', sortOrder: 60, pagePrefixes: ['/admin/weir-books'], apiPrefixes: ['/api/admin/weir-books'] },
  { key: 'storage-reports', name: 'Storage Report', href: '/admin/storage-reports', icon: '🏞️', sortOrder: 65, pagePrefixes: ['/admin/storage-reports'], apiPrefixes: ['/api/admin/storage-reports'] },
  { key: 'pages', name: 'Web Pages', href: '/admin/pages', icon: '📄', sortOrder: 70, pagePrefixes: ['/admin/pages'], apiPrefixes: ['/api/admin/pages'] },
  { key: 'navigation', name: 'Web Menus', href: '/admin/navigation', icon: '🔗', sortOrder: 80, pagePrefixes: ['/admin/navigation'], apiPrefixes: ['/api/admin/navigation'] },
  { key: 'tickets', name: 'Support Tickets', href: '/admin/tickets', icon: '🎫', sortOrder: 90, pagePrefixes: ['/admin/tickets'], apiPrefixes: ['/api/admin/tickets'] },
  { key: 'schedulers', name: 'Drone Request', href: '/admin/schedulers', icon: '🚁', sortOrder: 100, pagePrefixes: ['/admin/schedulers'], apiPrefixes: ['/api/admin/schedulers'] },
  { key: 'audit-logs', name: 'Audit Log', href: '/admin/audit-logs', icon: '📋', sortOrder: 110, pagePrefixes: ['/admin/audit-logs'], apiPrefixes: ['/api/admin/audit-logs'] },
  { key: 'users', name: 'Users', href: '/admin/users', icon: '👤', sortOrder: 120, pagePrefixes: ['/admin/users'], apiPrefixes: [] },
]

function pathMatchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

export function featureKeyForPath(pathname: string): string | null {
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/admin/list-views') ||
    pathname.startsWith('/api/admin/me') ||
    pathname.startsWith('/admin/dashboard')
  ) {
    return null
  }

  if (pathname.startsWith('/admin/features') || pathname.startsWith('/api/admin/features')) {
    return 'features'
  }

  if (/\/api\/admin\/users\/[^/]+\/features/.test(pathname)) {
    return 'features'
  }

  for (const feature of FEATURE_CATALOG) {
    const prefixes = pathname.startsWith('/api/') ? feature.apiPrefixes : feature.pagePrefixes
    if (prefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) {
      return feature.key
    }
  }

  return null
}

export function firstAllowedHref(featureKeys: string[], isAdmin: boolean) {
  const first = FEATURE_CATALOG.find((feature) => featureKeys.includes(feature.key))
  if (first) return first.href
  return isAdmin ? '/admin/features' : '/admin/dashboard'
}
