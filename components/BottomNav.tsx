'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    href: '/home', label: '홈',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} width={22} height={22}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  {
    href: '/schedule', label: '스케줄',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} width={22} height={22}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    href: '/upload', label: '업로드', isCenter: true,
    icon: () => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    )
  },
  {
    href: '/history', label: '내역',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} width={22} height={22}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  },
  {
    href: '/my', label: '마이',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} width={22} height={22}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, background: '#fff',
      borderTop: '1px solid rgba(33,26,51,.1)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        const active = pathname.startsWith(item.href)
        if (item.isCenter) {
          return (
            <Link key={item.href} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, background: '#211A33', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20, boxShadow: '0 4px 12px rgba(33,26,51,.25)' }}>
                {item.icon(active)}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(33,26,51,.46)' }}>{item.label}</span>
            </Link>
          )
        }
        return (
          <Link key={item.href} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', textDecoration: 'none', color: active ? '#211A33' : 'rgba(33,26,51,.4)' }}>
            {item.icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
