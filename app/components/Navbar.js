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
    <nav style={{
      background: 'rgba(10,10,10,0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '20px', height: '20px',
          background: 'var(--accent)',
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: '#000'
        }}>S</div>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
          Smart IoT Store
        </span>
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: pathname === link.href ? 500 : 400,
            color: pathname === link.href ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: pathname === link.href ? 'var(--bg-tertiary)' : 'transparent',
            border: pathname === link.href ? '1px solid var(--border)' : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}