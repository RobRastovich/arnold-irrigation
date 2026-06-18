'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const menuItems = [
  { name: 'Dashboard', icon: '📊', href: '/admin/dashboard' },
  { name: 'Patrons', icon: '👥', href: '/admin/patrons' },
  { name: 'Users', icon: '👤', href: '/admin/users' },
  { name: 'Tickets', icon: '🎫', href: '/admin/tickets' },
  { name: 'Audit Logs', icon: '📋', href: '/admin/audit-logs' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/admin/login')
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">AID</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">Arnold ID</h1>
            <p className="text-xs text-gray-400">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white w-full"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
