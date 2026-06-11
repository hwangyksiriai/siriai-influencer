'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { T } from '@/lib/theme'

const inp: React.CSSProperties = {
  width: '100%', background: T.surface2, border: `1.5px solid ${T.line}`,
  borderRadius: 16, padding: '15px 16px', fontSize: 16, color: T.ink,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontFamily: T.fontUI, fontSize: 12, fontWeight: 600,
  color: T.ink2, display: 'block', marginBottom: 7,
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
    <div className="dvh-screen" style={{
      background: T.bg, fontFamily: T.fontUI, color: T.ink,
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* 파스텔 앰비언트 배경 */}
      <div aria-hidden style={{ position: 'absolute', top: -120, left: -80, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${T.sage} 0%, transparent 68%)`, opacity: 0.55, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: -40, right: -110, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${T.blush} 0%, transparent 68%)`, opacity: 0.5, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: 170, left: '38%', width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${T.lav} 0%, transparent 70%)`, opacity: 0.4, pointerEvents: 'none' }} />

      <div className="au-step" style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'max(40px, env(safe-area-inset-top)) 28px max(40px, env(safe-area-inset-bottom))',
        position: 'relative',
      }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.14em', color: T.ink3, marginBottom: 10 }}>
            INFLUENCER PLATFORM
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', color: T.ink, margin: 0, lineHeight: 1.05 }}>
            SIRIAI
          </h1>
          <p style={{ fontSize: 14.5, color: T.ink2, marginTop: 12, lineHeight: 1.6 }}>
            브랜드 캠페인을 만나는 가장 쉬운 방법.<br />로그인하고 새 캠페인을 확인해 보세요.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div>
            <label htmlFor="login-email" style={lbl}>이메일</label>
            <input id="login-email" className="au-input" style={inp} type="email" inputMode="email"
              autoComplete="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="next" placeholder="email@example.com"
              value={email} onChange={e => { setEmail(e.target.value); if (error) setError('') }} required />
          </div>
          <div>
            <label htmlFor="login-pw" style={lbl}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input id="login-pw" className="au-input" style={{ ...inp, paddingRight: 64 }}
                type={showPw ? 'text' : 'password'} autoComplete="current-password" enterKeyHint="done" placeholder="비밀번호 입력"
                value={password} onChange={e => { setPassword(e.target.value); if (error) setError('') }} required />
              <button type="button" onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={showPw}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: T.ink3, cursor: 'pointer', padding: '10px 8px' }}>
                {showPw ? '숨김' : '보기'}
              </button>
            </div>
          </div>

          {error && (
            <div className="au-error" role="alert" style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'rgba(176,71,59,0.07)', border: '1px solid rgba(176,71,59,0.18)',
              borderRadius: 12, padding: '11px 13px',
            }}>
              <span style={{ fontSize: 13, lineHeight: '19px' }}>⚠️</span>
              <p style={{ fontSize: 13, color: T.danger, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password} style={{
            background: T.accent, color: T.accentInk, borderRadius: 999,
            padding: '16px', fontSize: 15.5, fontWeight: 700, border: 'none',
            cursor: loading || !email || !password ? 'default' : 'pointer',
            marginTop: 6, opacity: loading || !email || !password ? 0.45 : 1,
            transition: 'opacity .2s', fontFamily: 'inherit',
          }}>
            {loading && <span className="au-spinner" aria-hidden />}
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 26, fontSize: 14, color: T.ink3 }}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: T.ink, fontWeight: 700, textDecoration: 'none', borderBottom: `1.5px solid ${T.ink}`, paddingBottom: 1 }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}
