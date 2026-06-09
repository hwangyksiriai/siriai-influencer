'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { T } from '@/lib/theme'

const inp: React.CSSProperties = {
  width: '100%', background: T.surface2, border: `1px solid ${T.line}`,
  borderRadius: 12, padding: '14px 16px', fontSize: 15, color: T.ink,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontFamily: T.fontUI, fontSize: 10, letterSpacing: '.06em',
  textTransform: 'uppercase', color: T.ink3, display: 'block', marginBottom: 6,
}
const chip = (active: boolean): React.CSSProperties => ({
  borderRadius: 100, padding: '7px 14px', fontSize: 13, border: `1px solid ${T.line}`,
  cursor: 'pointer', transition: 'all .15s',
  background: active ? T.accent : 'transparent', color: active ? T.accentInk : T.ink,
})

const CATEGORIES = ['색조', '스킨케어', '패션', '라이프', '육아', '피트니스']
const GENDERS = ['여성', '남성']
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState({ email: '', password: '', name: '', handle: '', gender: '', region: '', youtube_url: '', blog_url: '', tiktok_url: '' })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggleCat = (c: string) => setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  // 비밀번호: 영문 + 숫자 포함 8자 이상
  const pwValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)

  function goStep2() {
    if (!form.email) { setError('이메일을 입력해주세요.'); return }
    if (!pwValid) { setError('비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.'); return }
    setError('')
    setStep(2)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.handle) { setError('이름과 인스타 핸들을 입력해주세요.'); return }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      const { error: insErr } = await supabase.from('influencers').insert([{
        id: data.user.id,
        name: form.name,
        handle: form.handle,
        email: form.email,
        gender: form.gender || null,
        region: form.region || null,
        category: categories,
        youtube_url: form.youtube_url || null,
        blog_url: form.blog_url || null,
        tiktok_url: form.tiktok_url || null,
        status: 'pending',
      }])
      if (insErr) { setError('프로필 저장 실패: ' + insErr.message); setLoading(false); return }
    }
    setLoading(false)
    setDone(true)
  }

  // 가입 신청 완료 (검토 대기) 화면
  if (done) {
    return (
      <div style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 28px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 44, marginBottom: 16 }}>📨</p>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, marginBottom: 12 }}>가입 신청이 완료됐어요</h1>
        <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.7, marginBottom: 28 }}>
          인스타그램 계정 확인 및 검토 후 승인돼요.<br />승인되면 로그인하실 수 있어요.
        </p>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            로그인 화면으로
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex', flexDirection: 'column', padding: '40px 28px',
    }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/login" style={{ fontSize: 13, color: T.ink3, textDecoration: 'none' }}>← 로그인</Link>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, marginTop: 16, marginBottom: 0 }}>
          회원가입
        </h1>
      </div>

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? T.accent : T.line, transition: 'background .3s' }} />
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
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inp, paddingRight: 60 }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="영문+숫자 8자 이상"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, color: T.ink2, cursor: 'pointer' }}>
                  {showPw ? '숨김' : '보기'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: T.ink3, margin: '6px 2px 0' }}>영문과 숫자를 포함해 8자 이상</p>
            </div>
            {error && <p style={{ fontSize: 12, color: T.danger, margin: 0 }}>{error}</p>}
            <button type="button" onClick={goStep2}
              style={{ background: T.accent, color: T.accentInk, borderRadius: 100, padding: '15px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 'auto' }}>
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
              <label style={lbl}>성별</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GENDERS.map(g => (
                  <button key={g} type="button" onClick={() => set('gender', g)} style={chip(form.gender === g)}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>거주지역</label>
              <select style={inp} value={form.region} onChange={e => set('region', e.target.value)}>
                <option value="">지역 선택</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>카테고리 (복수 선택)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => toggleCat(c)} style={chip(categories.includes(c))}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>SNS 링크 (선택)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={inp} type="url" placeholder="유튜브 채널 링크" value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} />
                <input style={inp} type="url" placeholder="블로그 링크" value={form.blog_url} onChange={e => set('blog_url', e.target.value)} />
                <input style={inp} type="url" placeholder="틱톡 링크" value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} />
              </div>
            </div>
            {error && <p style={{ fontSize: 12, color: T.danger, margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ background: T.accent, color: T.accentInk, borderRadius: 100, padding: '15px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 'auto', opacity: loading ? .6 : 1 }}>
              {loading ? '신청 중...' : '가입 신청'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
