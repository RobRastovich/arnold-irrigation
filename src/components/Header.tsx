'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface NavLink {
  id: string
  label: string
  url: string
  openInNew: boolean
  sortOrder: number
}

interface NavGroup {
  id: string
  label: string
  sortOrder: number
  links: NavLink[]
}

interface NavData {
  groups: NavGroup[]
  topLevelLinks: NavLink[]
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navData, setNavData] = useState<NavData>({ groups: [], topLevelLinks: [] })

  useEffect(() => {
    fetch('/api/navigation')
      .then((r) => r.json())
      .then((data) => setNavData(data))
      .catch(() => {})
  }, [])

  const linkProps = (link: NavLink) => ({
    href: link.url,
    ...(link.openInNew ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  })

  return (
    <header className="bg-primary-800 text-white">
      {/* Top bar */}
      <div className="bg-primary-900 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex gap-4">
            <Link href="/pay-bill" className="hover:text-primary-300 transition">
              Pay Bill Online
            </Link>
            <Link href="/contact" className="hover:text-primary-300 transition">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <img
              src="/AIDLogo.png"
              alt="Arnold Irrigation District"
              style={{ height: '52px', width: 'auto' }}
            />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-primary-300 transition font-medium">
              Home
            </Link>

            {/* Top-level links (no group) */}
            {navData.topLevelLinks.map((link) => (
              <Link
                key={link.id}
                {...linkProps(link)}
                className="hover:text-primary-300 transition font-medium"
              >
                {link.label}
              </Link>
            ))}

            {/* Dropdown groups */}
            {navData.groups.map((group) => (
              <div key={group.id} className="relative group">
                <button className="hover:text-primary-300 transition font-medium flex items-center gap-1">
                  {group.label}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {group.links.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="py-2">
                      {group.links.map((link) => (
                        <Link
                          key={link.id}
                          {...linkProps(link)}
                          className="block px-4 py-2 hover:bg-primary-50"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link href="/login" className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg transition">
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-primary-700 pt-4">
            <div className="flex flex-col gap-4">
              <Link href="/" className="hover:text-primary-300 transition">
                Home
              </Link>
              {navData.topLevelLinks.map((link) => (
                <Link key={link.id} {...linkProps(link)} className="hover:text-primary-300 transition">
                  {link.label}
                </Link>
              ))}
              {navData.groups.map((group) => (
                <div key={group.id}>
                  <p className="text-primary-300 text-xs uppercase tracking-wide font-semibold mb-1">{group.label}</p>
                  {group.links.map((link) => (
                    <Link key={link.id} {...linkProps(link)} className="block pl-3 py-1 hover:text-primary-300 transition">
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
              <Link href="/login" className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg transition text-center">
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
