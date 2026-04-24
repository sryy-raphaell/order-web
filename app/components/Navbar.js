'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Katalog' },
    { href: '/dashboard', label: 'IoT Dashboard' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="font-medium text-sm">Smart IoT Store</span>
        <div className="flex gap-1 flex-wrap">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === link.href
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}