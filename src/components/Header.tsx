'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-primary-800 text-white">
      {/* Top bar with quick links */}
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
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary-800 font-bold text-xl">AID</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Arnold Irrigation District</h1>
              <p className="text-xs text-primary-200">Management System</p>
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-primary-300 transition font-medium">
              Home
            </Link>
            
            <div className="relative group">
              <button className="hover:text-primary-300 transition font-medium flex items-center gap-1">
                The District
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-2">
                  <Link href="/district/history" className="block px-4 py-2 hover:bg-primary-50">
                    History
                  </Link>
                  <Link href="/district/board" className="block px-4 py-2 hover:bg-primary-50">
                    Board of Directors
                  </Link>
                  <Link href="/district/staff" className="block px-4 py-2 hover:bg-primary-50">
                    Staff
                  </Link>
                  <Link href="/district/meetings" className="block px-4 py-2 hover:bg-primary-50">
                    Board Meetings
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="hover:text-primary-300 transition font-medium flex items-center gap-1">
                Operations
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-2">
                  <Link href="/operations/projects" className="block px-4 py-2 hover:bg-primary-50">
                    Projects
                  </Link>
                  <Link href="/operations/canal" className="block px-4 py-2 hover:bg-primary-50">
                    Canal Piping
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="hover:text-primary-300 transition font-medium flex items-center gap-1">
                Resources
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-2">
                  <Link href="/resources/topics" className="block px-4 py-2 hover:bg-primary-50">
                    Useful Topics
                  </Link>
                  <Link href="/resources/manuals" className="block px-4 py-2 hover:bg-primary-50">
                    Manuals
                  </Link>
                  <Link href="/resources/forms" className="block px-4 py-2 hover:bg-primary-50">
                    Forms
                  </Link>
                  <Link href="/resources/links" className="block px-4 py-2 hover:bg-primary-50">
                    Links
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/news" className="hover:text-primary-300 transition font-medium">
              News & Events
            </Link>

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
              <Link href="/district/history" className="hover:text-primary-300 transition">
                The District
              </Link>
              <Link href="/operations/projects" className="hover:text-primary-300 transition">
                Operations
              </Link>
              <Link href="/resources/topics" className="hover:text-primary-300 transition">
                Resources
              </Link>
              <Link href="/news" className="hover:text-primary-300 transition">
                News & Events
              </Link>
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
