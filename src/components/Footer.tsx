import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Arnold Irrigation District</h3>
            <p className="text-primary-200 text-sm">
              Providing reliable water management and irrigation services to our community since 1906.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pay-bill" className="text-primary-200 hover:text-white transition">
                  Pay My Bill
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-200 hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="text-primary-200 hover:text-white transition">
                  Sign up for Alerts
                </Link>
              </li>
              <li>
                <Link href="/notices" className="text-primary-200 hover:text-white transition">
                  Important Notices
                </Link>
              </li>
            </ul>
          </div>

          {/* District */}
          <div>
            <h3 className="text-lg font-bold mb-4">The District</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/district/history" className="text-primary-200 hover:text-white transition">
                  History
                </Link>
              </li>
              <li>
                <Link href="/district/board" className="text-primary-200 hover:text-white transition">
                  Board of Directors
                </Link>
              </li>
              <li>
                <Link href="/district/staff" className="text-primary-200 hover:text-white transition">
                  Staff
                </Link>
              </li>
              <li>
                <Link href="/district/meetings" className="text-primary-200 hover:text-white transition">
                  Board Meetings
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-primary-200">
              <li>123 Irrigation Way</li>
              <li>Bend, OR 97701</li>
              <li>Phone: (541) 555-1234</li>
              <li>Email: info@arnoldid.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-8 pt-8 text-center text-sm text-primary-200">
          <p>&copy; {new Date().getFullYear()} Arnold Irrigation District. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
