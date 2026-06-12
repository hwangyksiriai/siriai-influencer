'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// 온보딩 슬라이드 카피
const SLIDES = [
  { title: '브랜드 캠페인을\n한 곳에서 만나요', body: '모집 중인 캠페인을 둘러보고\n맞는 캠페인에 바로 신청하세요.' },
  { title: '진행부터 정산까지\n흐름대로 따라가요', body: '일정 확인, 링크 업로드, 검수, 정산.\n복잡한 과정을 앱이 안내해 드려요.' },
  { title: '지금 바로\n시작해 볼까요?', body: '30초면 충분해요.\n계정을 만들고 첫 캠페인을 만나보세요.' },
]

// 온보딩 랜딩 — 로그인 상태면 홈으로, 아니면 포토 히어로 + 슬라이드 + CTA
export default function RootPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const touchedRef = useRef(false) // 사용자가 직접 스와이프하면 자동 진행 중단

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { router.replace('/home'); return }
      setReady(true)
    })
  }, [router])

  // 자동 진행 (4초 간격, 사용자 조작 시 중단)
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      if (touchedRef.current) return
      const el = trackRef.current
      if (!el) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % SLIDES.length
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, 4000)
    return () => clearInterval(timer)
  }, [ready])

  // 스크롤 위치 → 도트 동기화
  function onScroll() {
    const el = trackRef.current
    if (!el) return
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="dvh-screen" style={{ position: 'relative', background: '#0E0D0B', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 포토 배경 + 그라데이션 오버레이 */}
      <img src="/brand/onboard.png" alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,8,0.25) 0%, rgba(10,10,8,0.05) 34%, rgba(10,10,8,0.42) 62%, rgba(10,10,8,0.9) 100%)' }} />

      {/* 콘텐츠 */}
      <div className={ready ? 'au-step' : undefined} style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        paddingBottom: 'max(28px, env(safe-area-inset-bottom))', opacity: ready ? 1 : 0, transition: 'opacity .4s',
      }}>
        {/* 슬라이드 트랙 (가로 스크롤 스냅) */}
        <div ref={trackRef} onScroll={onScroll} onTouchStart={() => { touchedRef.current = true }} onPointerDown={() => { touchedRef.current = true }}
          style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', marginBottom: 18 }}>
          {SLIDES.map((s, i) => (
            <div key={i} style={{ minWidth: '100%', scrollSnapAlign: 'center', padding: '0 28px', boxSizing: 'border-box', textAlign: 'center' }}>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 29, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.28, whiteSpace: 'pre-line' }}>{s.title}</h1>
              <p style={{ margin: '12px auto 0', maxWidth: 290, color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{s.body}</p>
            </div>
          ))}
        </div>

        {/* 페이저 도트 */}
        <div aria-hidden style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{ width: page === i ? 22 : 6, height: 6, borderRadius: 999, background: page === i ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all .3s' }} />
          ))}
        </div>

        <div style={{ padding: '0 24px' }}>
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
    </div>
  )
}
