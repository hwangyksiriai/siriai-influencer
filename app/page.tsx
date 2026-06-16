'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GlassPhotoBackground, GlassButton } from '@/components/glass'

// 온보딩 슬라이드 (레퍼 2 — 흑백 사진 글래스)
const SLIDES = [
  { title: '사람과 브랜드를\n잇는 특별한 연결', body: '취향과 데이터를 읽어, 어울리는 캠페인만 골라 제안해 드려요.' },
  { title: '제안부터 정산까지\n한 곳에서', body: '지원 · 일정 · 업로드 · 정산 내역을 SIRIAI 한 앱에서 관리하세요.' },
  { title: '지금 바로\n시작해 볼까요?', body: '30초면 충분해요. 계정을 만들고 첫 캠페인을 만나보세요.' },
]

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
      <GlassPhotoBackground position="center 24%" />

      <div className={ready ? 'au-step' : undefined} style={{
        position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column',
        padding: 'max(56px, env(safe-area-inset-top)) 26px max(30px, env(safe-area-inset-bottom))',
        opacity: ready ? 1 : 0, transition: 'opacity .4s',
      }}>
        {/* 상단: 워드마크 + 건너뛰기 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/siriai-logo-white.png" alt="SIRIAI" style={{ height: 19, width: 'auto', display: 'block', filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.45))' }} />
          {!last && (
            <button type="button" onClick={() => setI(SLIDES.length - 1)}
              style={{ background: 'none', border: 'none', color: 'var(--g-text-dim)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '6px 4px' }}>
              건너뛰기
            </button>
          )}
        </div>

        {/* 카피 — 하단에 핀 (스크림 위) */}
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'center', padding: '0 6px 18px' }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.26, fontWeight: 800, color: 'var(--g-text)', letterSpacing: '-0.02em', whiteSpace: 'pre-line' }}>{slide.title}</h1>
          <p style={{ margin: '14px auto 0', maxWidth: 290, fontSize: 14.5, lineHeight: 1.6, color: 'var(--g-text)', opacity: 0.86 }}>{slide.body}</p>
        </div>

        {/* 도트 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 22 }}>
          {SLIDES.map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`${k + 1}번째 슬라이드`}
              style={{ height: 6, borderRadius: 999, cursor: 'pointer', border: 'none', transition: 'width .25s, background .25s', padding: 0,
                width: k === i ? 22 : 6, background: k === i ? '#fff' : 'rgba(255,255,255,0.32)' }} />
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
