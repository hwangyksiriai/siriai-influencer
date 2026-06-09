'use client'

import { useRouter, usePathname } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, paddingBottom: 'max(18px, env(safe-area-inset-bottom))', zIndex: 40, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 14px' }}>
        <div style={{ position: 'relative', height: 66, borderRadius: 26, overflow: 'hidden', pointerEvents: 'auto', boxShadow: '0 10px 30px rgba(20,18,14,0.14), 0 2px 8px rgba(20,18,14,0.06)' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${T.sage}80, ${T.blush}73, ${T.lav}80)`, opacity: 0.9 }} />
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(18px) saturate(180%)', WebkitBackdropFilter: 'blur(18px) saturate(180%)', background: 'rgba(255,255,255,0.55)' }} />
          <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.6)', borderRadius: 26, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
            {items.map((it) => {
              const I = it.icon
              const on = pathname.startsWith(it.href)
              if (it.center) return (
                <div key={it.href} style={{ width: 56, display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => router.push(it.href)} aria-label={it.label} style={{ width: 52, height: 52, borderRadius: 18, marginTop: -26, border: `3px solid ${T.surface}`, background: T.accent, color: T.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(20,18,14,0.28)', cursor: 'pointer' }}><I width="26" height="26" /></button>
                </div>
              )
              return (
                <button key={it.href} onClick={() => router.push(it.href)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: on ? T.ink : T.ink3, position: 'relative' }}>
                  <I width="23" height="23" />
                  <span style={{ fontFamily: T.fontUI, fontSize: 10.5, fontWeight: on ? 700 : 500, letterSpacing: '-0.01em' }}>{it.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
