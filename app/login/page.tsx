'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { T } from '@/lib/theme'

const inp: React.CSSProperties = {
  width: '100%', background: T.surface2, border: `1px solid ${T.line}`,
  borderRadius: 14, padding: '15px 16px', fontSize: 15, color: T.ink,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
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
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('이메일 또는 비밀번호가 틀렸어요.'); setLoading(false); return }

    const { data: inf } = await supabase.from('influencers').select('status').eq('id', data.user?.id).single()
    setLoading(false)
    if (inf && inf.status && inf.status !== 'approved') {
      await supabase.auth.signOut()
      setError(inf.status === 'rejected'
        ? '가입이 반려되었어요. 문의해 주세요.'
        : '아직 승인 대기 중이에요. 검토 후 승인되면 이용할 수 있어요.')
      return
    }
    router.push('/home')
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px',
    }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, marginBottom: 8 }}>
          SIRIAI
        </h1>
        <p style={{ fontSize: 14, color: T.ink3 }}>인플루언서 캠페인 플랫폼</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={inp} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        <div style={{ position: 'relative' }}>
          <input style={{ ...inp, paddingRight: 60 }} type={showPw ? 'text' : 'password'} placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPw(s => !s)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, color: T.ink3, cursor: 'pointer' }}>
            {showPw ? '숨김' : '보기'}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: T.danger, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: T.accent, color: T.accentInk, borderRadius: 999,
          padding: '15px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
          marginTop: 4, opacity: loading ? .6 : 1,
        }}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.ink3 }}>
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" style={{ color: T.ink, fontWeight: 600, textDecoration: 'none' }}>회원가입</Link>
      </p>
    </div>
  )
}
