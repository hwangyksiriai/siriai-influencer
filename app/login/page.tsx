'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GlassButton, GlassInput, GlassIconButton, GlassError, PwToggle } from '@/components/glass'

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
      {/* 사진2 배경 + 브랜드 톤 스크림 (글래스 입력이 사진 위로 프로스트) */}
      <img src="/brand/auth.png" alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(34,24,72,0.46) 0%, rgba(28,20,58,0.40) 38%, rgba(18,13,40,0.72) 78%, rgba(14,10,30,0.9) 100%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(120% 80% at 18% 6%, rgba(120,110,255,0.28), transparent 55%)', mixBlendMode: 'screen' }} />
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
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--g-text-dim)' }}>
          아직 회원이 아니신가요?{' '}
          <Link href="/signup" style={{ color: 'var(--g-text)', fontWeight: 700, textDecoration: 'none' }}>회원가입</Link>
        </div>
      </div>
    </div>
  )
}
