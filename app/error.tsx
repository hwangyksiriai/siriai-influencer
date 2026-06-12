'use client'

import { T } from '@/lib/theme'

// 전역 에러 바운더리 — 런타임 오류 시 백지 대신 복구 안내
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="dvh-screen" style={{
      background: T.bg, fontFamily: T.fontUI, color: T.ink,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 28px', textAlign: 'center',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 26 }}>⚠️</div>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>일시적인 문제가 생겼어요</h1>
      <p style={{ margin: '10px 0 26px', fontSize: 14, color: T.ink2, lineHeight: 1.65 }}>
        잠시 후 다시 시도해 주세요.<br />문제가 계속되면 고객센터로 알려주세요.
      </p>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
        <button type="button" onClick={() => reset()}
          style={{ flex: 1, background: T.accent, color: T.accentInk, border: 'none', borderRadius: 14, padding: '15px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          다시 시도
        </button>
        <a href="/home" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, color: T.ink, border: `1px solid ${T.line}`, borderRadius: 14, padding: '15px', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' }}>
          홈으로
        </a>
      </div>
    </div>
  )
}
