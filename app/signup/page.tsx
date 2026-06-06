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
const lbl: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em',
  textTransform: 'uppercase', color: 'rgba(33,26,51,.46)', display: 'block', marginBottom: 6,
}

const CATEGORIES = ['뷰티', '패션', '라이프', '푸드', '여행', '육아', '피트니스']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState({
    email: '', password: '', name: '', handle: '', followers: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (c: string) => setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.handle) { setError('이름과 인스타 핸들을 입력해주세요.'); return }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('influencers').insert([{
        id: data.user.id,
        name: form.name,
        handle: form.handle,
        followers: form.followers ? parseInt(form.followers) : 0,
        email: form.email,
        category: categories,
      }])
    }
    setLoading(false)
    router.push('/home')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(60% 50% at 85% 5%, rgba(221,208,239,.4), transparent 55%), #F3EEE2`,
      display: 'flex', flexDirection: 'column', padding: '40px 28px',
    }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/login" style={{ fontSize: 13, color: 'rgba(33,26,51,.46)', textDecoration: 'none' }}>← 로그인</Link>
        <h1 style={{ fontFamily: "'Helvetica Neue','Helvetica',sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: '#211A33', marginTop: 16, marginBottom: 0 }}>
          회원가입
        </h1>
      </div>

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? '#211A33' : 'rgba(33,26,51,.15)', transition: 'background .3s' }} />
        ))}
      </div>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {step === 1 && (
          <>
            <div>
              <label style={lbl}>이메일</label>
              <input style={inp} type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>비밀번호</label>
              <input style={inp} type="password" placeholder="8자 이상" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>
            <button type="button" onClick={() => { if (!form.email || !form.password) return; setStep(2) }}
              style={{ background: '#211A33', color: '#F3EEE2', borderRadius: 100, padding: '15px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 'auto' }}>
              다음
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>이름</label>
                <input style={inp} type="text" placeholder="홍길동" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>인스타 핸들</label>
                <input style={inp} type="text" placeholder="my_handle" value={form.handle} onChange={e => set('handle', e.target.value)} required />
              </div>
            </div>
            <div>
              <label style={lbl}>팔로워 수</label>
              <input style={inp} type="number" placeholder="1000" value={form.followers} onChange={e => set('followers', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>카테고리 (복수 선택)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => toggleCat(c)}
                    style={{ borderRadius: 100, padding: '7px 14px', fontSize: 13, border: '1px solid rgba(33,26,51,.2)', cursor: 'pointer', background: categories.includes(c) ? '#211A33' : 'transparent', color: categories.includes(c) ? '#F3EEE2' : '#211A33', transition: 'all .15s' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {error && <p style={{ fontSize: 12, color: '#e03', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ background: '#211A33', color: '#F3EEE2', borderRadius: 100, padding: '15px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 'auto', opacity: loading ? .6 : 1 }}>
              {loading ? '가입 중...' : '가입 완료'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
