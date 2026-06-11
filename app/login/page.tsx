'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.20)',
  borderRadius: 14, padding: '15px 16px', fontSize: 16,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
}
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.62)',
  display: 'block', marginBottom: 7, letterSpacing: '0.01em',
}

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
    <div className="dvh-screen" style={{ position: 'relative', background: '#0E0D0B', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* 포토 배경 + 오버레이 */}
      <img src="/brand/auth.png" alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,8,0.45) 0%, rgba(10,10,8,0.55) 45%, rgba(10,10,8,0.85) 100%)' }} />

      <div className="au-step" style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'max(24px, env(safe-area-inset-top)) 26px max(32px, env(safe-area-inset-bottom))',
      }}>
        {/* 뒤로가기 */}
        <Link href="/" aria-label="처음 화면으로" style={{
          position: 'absolute', top: 'max(18px, env(safe-area-inset-top))', left: 18,
          width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', color: '#fff', textDecoration: 'none',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>

        <div style={{ marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2 }}>
            다시 오신 걸 환영해요
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>
            로그인하고 캠페인을 이어가세요.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div>
            <label htmlFor="login-email" style={lbl}>이메일</label>
            <input id="login-email" className="au-dark" style={inp} type="email" inputMode="email"
              autoComplete="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="next" placeholder="email@example.com"
              value={email} onChange={e => { setEmail(e.target.value); if (error) setError('') }} required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
              <label htmlFor="login-pw" style={{ ...lbl, marginBottom: 0 }}>비밀번호</label>
              <Link href="/support?tab=inquiry" style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input id="login-pw" className="au-dark" style={{ ...inp, paddingRight: 64 }}
                type={showPw ? 'text' : 'password'} autoComplete="current-password" enterKeyHint="done" placeholder="비밀번호 입력"
                value={password} onChange={e => { setPassword(e.target.value); if (error) setError('') }} required />
              <button type="button" onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={showPw}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '10px 8px', fontFamily: 'inherit' }}>
                {showPw ? '숨김' : '보기'}
              </button>
            </div>
          </div>

          {error && (
            <div className="au-error" role="alert" style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'rgba(255,107,92,0.16)', border: '1px solid rgba(255,107,92,0.38)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 12, padding: '11px 13px',
            }}>
              <span style={{ fontSize: 13, lineHeight: '19px' }}>⚠️</span>
              <p style={{ fontSize: 13, color: '#FFC4BB', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password} style={{
            background: '#fff', color: '#16140F', borderRadius: 14,
            padding: '16px', fontSize: 15.5, fontWeight: 700, border: 'none',
            cursor: loading || !email || !password ? 'default' : 'pointer',
            marginTop: 6, opacity: loading || !email || !password ? 0.5 : 1,
            transition: 'opacity .2s', fontFamily: 'inherit',
          }}>
            {loading && <span className="au-spinner-dark" aria-hidden />}
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 26, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
          아직 회원이 아닌가요?{' '}
          <Link href="/signup" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.8)', paddingBottom: 1 }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}
