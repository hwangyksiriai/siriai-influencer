'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GlassBackground, GlassButton } from '@/components/glass'

// 온보딩 슬라이드 (레퍼 2 글래스 리뉴얼)
const SLIDES = [
  { icon: 'spark', title: '사람과 브랜드를\n잇는 특별한 연결', body: '취향과 데이터를 읽어, 어울리는 캠페인만 골라 제안해 드려요.' },
  { icon: 'calendar', title: '제안부터 정산까지\n한 곳에서', body: '지원 · 일정 · 업로드 · 정산 내역을 SIRIAI 한 앱에서 관리하세요.' },
  { icon: 'heart', title: '지금 바로\n시작해 볼까요?', body: '30초면 충분해요. 계정을 만들고 첫 캠페인을 만나보세요.' },
]

function SlideIcon({ name, size = 38 }: { name: string; size?: number }) {
  const c = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'calendar') return <svg viewBox="0 0 24 24" {...c}><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
  if (name === 'heart') return <svg viewBox="0 0 24 24" {...c}><path d="M12 20S4 14.5 4 8.8A4.3 4.3 0 0 1 12 6a4.3 4.3 0 0 1 8 2.8C20 14.5 12 20 12 20z" /></svg>
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M12 2l2.2 6.2L20.5 10l-6.3 2.1L12 18.5l-2.2-6.4L3.5 10l6.3-1.8z" /></svg>
}

export default function RootPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { router.replace('/home'); return }
      setReady(true)
    })
  }, [router])

  return (
    <div className="dvh-screen glass-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <GlassBackground />
      {/* 하단 스크림 — 텍스트 가독성 */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '52%', zIndex: 0, background: 'linear-gradient(to top, rgba(20,12,48,0.5) 0%, rgba(20,12,48,0.18) 50%, transparent 100%)' }} />

      <div className={ready ? 'au-step' : undefined} style={{
        position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column',
        padding: 'max(56px, env(safe-area-inset-top)) 26px max(30px, env(safe-area-inset-bottom))',
        opacity: ready ? 1 : 0, transition: 'opacity .4s',
      }}>
        {/* 상단: 워드마크 + 건너뛰기 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/siriai-logo-white.png" alt="SIRIAI" style={{ height: 19, width: 'auto', display: 'block', filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))' }} />
          {!last && (
            <button type="button" onClick={() => setI(SLIDES.length - 1)}
              style={{ background: 'none', border: 'none', color: 'var(--g-text-dim)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '6px 4px' }}>
              건너뛰기
            </button>
          )}
        </div>

        {/* 히어로: 글래스 엠블럼 + 카피 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
          <div style={{
            width: 124, height: 124, borderRadius: '30%', position: 'relative',
            background: 'var(--g-tint-2)', border: '1px solid var(--g-border)',
            backdropFilter: 'blur(18px) saturate(170%)', WebkitBackdropFilter: 'blur(18px) saturate(170%)',
            boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.45), 0 16px 38px rgba(0,0,0,0.26)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g-text)',
          }}>
            <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(155deg, rgba(255,255,255,0.4), transparent 50%)' }} />
            <span style={{ position: 'relative' }}><SlideIcon name={slide.icon} size={52} /></span>
          </div>
          <div style={{ textAlign: 'center', padding: '0 6px' }}>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.26, fontWeight: 800, color: 'var(--g-text)', letterSpacing: '-0.02em', whiteSpace: 'pre-line' }}>{slide.title}</h1>
            <p style={{ margin: '14px auto 0', maxWidth: 290, fontSize: 14.5, lineHeight: 1.6, color: 'var(--g-text)', opacity: 0.88 }}>{slide.body}</p>
          </div>
        </div>

        {/* 도트 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 22 }}>
          {SLIDES.map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`${k + 1}번째 슬라이드`}
              style={{ height: 6, borderRadius: 999, cursor: 'pointer', border: 'none', transition: 'width .25s, background .25s', padding: 0,
                width: k === i ? 22 : 6, background: k === i ? '#fff' : 'var(--g-border)' }} />
          ))}
        </div>

        {/* CTA */}
        {last ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <GlassButton icon={<span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>→</span>}>시작하기</GlassButton>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <GlassButton variant="glass">이미 계정이 있어요 · 로그인</GlassButton>
            </Link>
          </div>
        ) : (
          <GlassButton onClick={() => setI(i + 1)} icon={<span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>→</span>}>다음</GlassButton>
        )}
      </div>
    </div>
  )
}
