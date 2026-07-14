'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const menuItems = [
  { name: 'Dashboard', icon: '📊', href: '/admin/dashboard' },
  { name: 'Patrons', icon: '👥', href: '/admin/patrons' },
  { name: 'Turnouts', icon: '💧', href: '/admin/turnouts' },
  { name: 'Rates', icon: '�', href: '/admin/rates' },
  { name: 'Assessments', icon: '🧾', href: '/admin/invoices' },
  { name: 'Weir Book', icon: '📖', href: '/admin/weir-books' },
  { name: 'Web Pages', icon: '�', href: '/admin/pages' },
  { name: 'Web Menus', icon: '🔗', href: '/admin/navigation' },
  { name: 'Suport Tickets', icon: '🎫', href: '/admin/tickets' },
  { name: 'Drone Request', icon: '�', href: '/admin/schedulers' },
  { name: 'Audit Log', icon: '📋', href: '/admin/audit-logs' },
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
        <div className="flex flex-col items-start gap-1">
          <img
            src="/WaterOps.png"
            alt="WaterOps"
            style={{ width: '150px', height: 'auto' }}
          />
          <p className="text-xs text-gray-400 pl-1">Admin Portal</p>
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
