'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// 온보딩 랜딩 — 로그인 상태면 홈으로, 아니면 포토 히어로 + CTA
export default function RootPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { router.replace('/home'); return }
      setReady(true)
    })
  }, [router])

  return (
    <div className="dvh-screen" style={{ position: 'relative', background: '#0E0D0B', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 포토 배경 + 그라데이션 오버레이 */}
      <img src="/brand/onboard.png" alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,8,0.25) 0%, rgba(10,10,8,0.05) 34%, rgba(10,10,8,0.42) 62%, rgba(10,10,8,0.88) 100%)' }} />

      {/* 콘텐츠 */}
      <div className={ready ? 'au-step' : undefined} style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 24px max(28px, env(safe-area-inset-bottom))', opacity: ready ? 1 : 0, transition: 'opacity .4s',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.25 }}>
            지금 바로<br />시작해 볼까요?
          </h1>
          <p style={{ margin: '12px auto 0', maxWidth: 280, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.65 }}>
            30초면 충분해요. 계정을 만들고 첫 캠페인을 만나보세요.
          </p>
          {/* 페이저 도트 (장식) */}
          <div aria-hidden style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.35)' }} />
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.35)' }} />
            <span style={{ width: 22, height: 6, borderRadius: 999, background: '#fff' }} />
          </div>
        </div>

        <Link href="/signup" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#fff', color: '#16140F', borderRadius: 16, padding: '17px',
          fontSize: 15.5, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em',
        }}>
          시작하기 <span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>→</span>
        </Link>
        <Link href="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10,
          background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.26)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          color: '#fff', borderRadius: 16, padding: '16px',
          fontSize: 14.5, fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em',
        }}>
          이미 계정이 있어요 · 로그인
        </Link>
      </div>
    </div>
  )
}
