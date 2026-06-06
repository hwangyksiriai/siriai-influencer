'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(33,26,51,.18)',
  borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#211A33',
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

    // 승인 상태 확인 (검토 후 승인된 인플루언서만 이용 가능)
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
      minHeight: '100vh',
      background: `radial-gradient(60% 50% at 15% 5%, rgba(246,201,168,.45), transparent 60%),
                   radial-gradient(50% 40% at 85% 10%, rgba(221,208,239,.4), transparent 55%), #F3EEE2`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px',
    }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Helvetica Neue','Helvetica',sans-serif", fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: '#211A33', marginBottom: 6 }}>
          SIRIAI
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)' }}>인플루언서 캠페인 플랫폼</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={inp} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        <div style={{ position: 'relative' }}>
          <input style={{ ...inp, paddingRight: 60 }} type={showPw ? 'text' : 'password'} placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPw(s => !s)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, color: 'rgba(33,26,51,.5)', cursor: 'pointer' }}>
            {showPw ? '숨김' : '보기'}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: '#e03', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#211A33', color: '#F3EEE2', borderRadius: 100,
          padding: '15px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
          marginTop: 4, opacity: loading ? .6 : 1,
        }}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(33,26,51,.5)' }}>
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" style={{ color: '#211A33', fontWeight: 600, textDecoration: 'none' }}>회원가입</Link>
      </p>
    </div>
  )
}
