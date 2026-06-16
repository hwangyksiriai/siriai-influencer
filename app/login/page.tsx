'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GlassPhotoBackground, GlassButton, GlassInput, GlassIconButton, GlassError, PwToggle } from '@/components/glass'

// 간편 로그인 버튼 (카카오/애플/구글)
const SOCIALS: { id: 'kakao' | 'apple' | 'google'; label: string; bg: string; ink: string; mark: React.ReactNode }[] = [
  { id: 'kakao', label: '카카오', bg: '#FEE500', ink: '#191600', mark: <span style={{ fontWeight: 800, fontSize: 18 }}>K</span> },
  { id: 'apple', label: '애플', bg: '#fff', ink: '#000', mark: <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.9zM14.2 5.8c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.7-1.3z"/></svg> },
  { id: 'google', label: '구글', bg: '#fff', ink: '#4285F4', mark: <span style={{ fontWeight: 800, fontSize: 18 }}>G</span> },
]

// Supabase 영문 에러 → 사용자용 한글 메시지
function authErrorKo(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요.'
  if (m.includes('email not confirmed')) return '이메일 인증이 완료되지 않았어요. 받은편지함을 확인해 주세요.'
  if (m.includes('too many requests') || m.includes('rate limit')) return '시도가 너무 많았어요. 잠시 후 다시 시도해 주세요.'
  if (m.includes('network') || m.includes('fetch')) return '네트워크 연결을 확인해 주세요.'
  return '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // 간편 로그인 — OAuth 프로바이더(카카오/애플/구글) 미설정 상태.
  // ⚠️ 활성화하려면: Supabase 대시보드 Authentication > Providers 에서 해당 프로바이더 설정 후
  //    아래 ENABLED 를 true 로 바꾸면 실제 OAuth 로그인으로 동작합니다.
  const SOCIAL_ENABLED = false
  async function social(provider: 'kakao' | 'apple' | 'google') {
    setError('')
    if (SOCIAL_ENABLED) {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined },
      })
      return
    }
    setToast('간편 로그인은 준비 중이에요. 이메일로 로그인해 주세요.')
    setTimeout(() => setToast(''), 2600)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(authErrorKo(error.message)); setLoading(false); return }

    const { data: inf, error: infErr } = await supabase.from('influencers').select('status').eq('id', data.user?.id).single()
    // 프로필이 없거나 조회 실패 시 통과시키지 않음 (승인 게이트 우회 방지)
    if (infErr || !inf) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('계정 정보를 확인할 수 없어요. 고객센터로 문의해 주세요.')
      return
    }
    if (inf.status && inf.status !== 'approved') {
      await supabase.auth.signOut()
      setLoading(false)
      setError(inf.status === 'rejected'
        ? '가입이 반려되었어요. 고객센터로 문의해 주세요.'
        : '아직 승인 대기 중이에요. 검토 후 승인되면 이용할 수 있어요.')
      return
    }
    router.push('/home')
  }

  return (
    <div className="dvh-screen glass-screen">
      <GlassPhotoBackground position="center 20%" />
      <div className="au-step" style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: 'max(56px, env(safe-area-inset-top)) 26px max(34px, env(safe-area-inset-bottom))' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 26 }}>
          <Link href="/" aria-label="처음 화면으로" style={{ display: 'inline-block', marginBottom: 22 }}>
            <GlassIconButton>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </GlassIconButton>
          </Link>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--g-text)', letterSpacing: '-0.02em' }}>다시 오신 걸 환영해요</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--g-text-dim)' }}>로그인하고 캠페인을 이어가세요.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          <GlassInput label="이메일" htmlFor="login-email" type="email" inputMode="email"
            autoComplete="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="next" placeholder="you@siriai.com"
            value={email} onChange={e => { setEmail(e.target.value); if (error) setError('') }} required />
          <GlassInput label="비밀번호" htmlFor="login-pw" type={showPw ? 'text' : 'password'}
            autoComplete="current-password" enterKeyHint="done" placeholder="••••••••"
            value={password} onChange={e => { setPassword(e.target.value); if (error) setError('') }} required
            trailing={<PwToggle show={showPw} onToggle={() => setShowPw(s => !s)} />} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
            <Link href="/support?tab=inquiry" style={{ color: 'var(--g-text-dim)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>비밀번호를 잊으셨나요?</Link>
          </div>

          {error && <GlassError>{error}</GlassError>}

          <GlassButton type="submit" disabled={loading || !email || !password} loading={loading} style={{ marginTop: 4 }}>
            {loading ? '로그인 중...' : '로그인'}
          </GlassButton>

          {/* 또는 간편 로그인 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--g-border-soft)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--g-text-faint)', fontWeight: 600, whiteSpace: 'nowrap' }}>또는 간편 로그인</span>
            <span style={{ flex: 1, height: 1, background: 'var(--g-border-soft)' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {SOCIALS.map(s => (
              <button key={s.id} type="button" onClick={() => social(s.id)} aria-label={`${s.label}로 로그인`}
                className="glass-btn"
                style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: s.bg, color: s.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.28)' }}>
                {s.mark}
              </button>
            ))}
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 26, fontSize: 14, color: 'var(--g-text-dim)' }}>
          아직 회원이 아니신가요?{' '}
          <Link href="/signup" style={{ color: 'var(--g-text)', fontWeight: 700, textDecoration: 'none' }}>회원가입</Link>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 'max(28px, env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 50, background: 'rgba(20,18,28,0.92)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '11px 18px', borderRadius: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', maxWidth: '90vw' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
