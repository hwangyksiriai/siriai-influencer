'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { T } from '@/lib/theme'
import { Ico } from '@/components/ui'

const items = [
  { href: '/home', label: '홈', icon: Ico.home },
  { href: '/history', label: '내역', icon: Ico.doc },
  { href: '/upload', label: '업로드', icon: Ico.upload, center: true },
  { href: '/messages', label: '메시지', icon: Ico.chat },
  { href: '/my', label: '마이', icon: Ico.user },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, paddingBottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 40, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 14px' }}>
        {/* 바깥 래퍼는 클리핑하지 않음 — 가운데 FAB가 위로 돌출되어도 잘리지 않게 */}
        <div style={{ position: 'relative', height: 66, pointerEvents: 'auto' }}>
          {/* 배경 레이어만 라운드+클리핑 적용 */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden', boxShadow: '0 10px 30px rgba(20,18,14,0.14), 0 2px 8px rgba(20,18,14,0.06)' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${T.sage}80, ${T.blush}73, ${T.lav}80)`, opacity: 0.9 }} />
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(18px) saturate(180%)', WebkitBackdropFilter: 'blur(18px) saturate(180%)', background: 'rgba(255,255,255,0.55)' }} />
            <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.6)', borderRadius: 26, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)' }} />
          </div>
          {/* 버튼 행 — 클리핑 없는 형제 레이어 */}
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', padding: '0 8px' }}>
            {items.map((it) => {
              const I = it.icon
              const on = pathname === it.href || pathname.startsWith(it.href + '/')
              if (it.center) return (
                <div key={it.href} style={{ width: 56, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <Link href={it.href} aria-label={it.label} style={{ width: 52, height: 52, borderRadius: 18, marginTop: -26, border: `3px solid ${T.surface}`, background: T.accent, color: T.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(20,18,14,0.28)', textDecoration: 'none' }}><I width="26" height="26" /></Link>
                </div>
              )
              return (
                <Link key={it.href} href={it.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: on ? T.ink : T.ink3, textDecoration: 'none' }}>
                  <I width="23" height="23" />
                  <span style={{ fontFamily: T.fontUI, fontSize: 10.5, fontWeight: on ? 700 : 500, letterSpacing: '-0.01em' }}>{it.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
