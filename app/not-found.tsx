import Link from 'next/link'
import { T } from '@/lib/theme'

// 404 — 삭제/만료된 링크 진입 시 안내
export default function NotFound() {
  return (
    <div className="dvh-screen" style={{
      background: T.bg, fontFamily: T.fontUI, color: T.ink,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 28px', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontFamily: T.fontDisplay, fontSize: 52, fontWeight: 700, letterSpacing: '-0.04em', color: T.ink3, lineHeight: 1 }}>404</p>
      <h1 style={{ margin: '14px 0 0', fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>페이지를 찾을 수 없어요</h1>
      <p style={{ margin: '10px 0 26px', fontSize: 14, color: T.ink2, lineHeight: 1.65 }}>
        주소가 바뀌었거나 삭제된 페이지예요.<br />홈에서 새 캠페인을 둘러보세요.
      </p>
      <Link href="/home" style={{
        display: 'block', width: '100%', maxWidth: 320, background: T.accent, color: T.accentInk,
        borderRadius: 14, padding: '15px', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
      }}>
        홈으로 가기
      </Link>
    </div>
  )
}
