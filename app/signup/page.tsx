'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { GlassPhotoBackground, GlassButton, GlassInput, GlassIconButton, GlassError, PwToggle } from '@/components/glass'

const CATEGORIES = ['색조', '스킨케어', '패션', '라이프', '육아', '피트니스']
const GENDERS = ['여성', '남성']
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
const STEPS = [{ n: 1, label: '계정 만들기' }, { n: 2, label: '프로필 입력' }]

const normalizeUrl = (v: string) => {
  const s = v.trim()
  if (!s) return null
  return /^https?:\/\//i.test(s) ? s : 'https://' + s
}

function signupErrorKo(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) return '이미 가입된 이메일이에요. 로그인해 주세요.'
  if (m.includes('invalid email')) return '이메일 형식이 올바르지 않아요.'
  if (m.includes('password')) return '비밀번호 조건을 확인해 주세요.'
  if (m.includes('rate limit') || m.includes('too many')) return '시도가 너무 많았어요. 잠시 후 다시 시도해 주세요.'
  if (m.includes('network') || m.includes('fetch')) return '네트워크 연결을 확인해 주세요.'
  return '가입에 실패했어요: ' + message
}

// 글래스 칩 (성별/카테고리)
function chip(active: boolean): React.CSSProperties {
  return {
    borderRadius: 100, padding: '10px 16px', fontSize: 14, fontWeight: 600,
    border: `1px solid ${active ? 'transparent' : 'var(--g-border-soft)'}`,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
    background: active ? '#fff' : 'var(--g-tint)', color: active ? 'var(--g-accent-ink)' : 'var(--g-text)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  }
}

function PwCheck({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: ok ? '#CFFFE0' : 'var(--g-text-faint)', transition: 'color .2s' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        {ok ? <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          : <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.45" />}
      </svg>
      {children}
    </span>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--g-text-dim)', margin: '0 0 7px 4px', letterSpacing: '-0.01em' }

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState({ email: '', password: '', name: '', handle: '', gender: '', region: '', youtube_url: '', blog_url: '', tiktok_url: '' })

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); if (error) setError('') }
  const toggleCat = (c: string) => setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())
  const pwLen = form.password.length >= 8
  const pwAlpha = /[A-Za-z]/.test(form.password)
  const pwNum = /\d/.test(form.password)
  const pwValid = pwLen && pwAlpha && pwNum

  function goStep2() {
    if (!form.email.trim()) { setError('이메일을 입력해 주세요.'); return }
    if (!emailValid) { setError('이메일 형식이 올바르지 않아요. 예: email@example.com'); return }
    if (!pwValid) { setError('비밀번호 조건을 모두 충족해 주세요.'); return }
    setError('')
    setStep(2)
  }

  async function handleSignup() {
    if (loading) return
    if (!form.name.trim() || !form.handle.trim()) { setError('이름과 인스타 핸들을 입력해 주세요.'); return }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password })
    if (authError) { setError(signupErrorKo(authError.message)); setLoading(false); return }

    if (data.user && (data.user.identities?.length ?? 1) === 0) {
      setError('이미 가입된 이메일이에요. 로그인해 주세요.')
      setLoading(false)
      return
    }

    if (data.user) {
      const handle = form.handle.trim().replace(/^@/, '')
      const { error: insErr } = await supabase.from('influencers').insert([{
        id: data.user.id, name: form.name.trim(), handle, email: form.email.trim(),
        gender: form.gender || null, region: form.region || null, category: categories,
        youtube_url: normalizeUrl(form.youtube_url), blog_url: normalizeUrl(form.blog_url), tiktok_url: normalizeUrl(form.tiktok_url),
        status: 'pending',
      }])
      if (insErr) {
        setError(insErr.message.toLowerCase().includes('duplicate') ? '이미 가입된 이메일이에요. 로그인해 주세요.' : '프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    setDone(true)
  }

  // 가입 완료
  if (done) {
    return (
      <div className="dvh-screen glass-screen au-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
        <GlassPhotoBackground position="center 18%" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--g-tint-2)', border: '1px solid var(--g-border)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.4)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--g-text)', marginBottom: 12 }}>가입 신청이 완료됐어요</h1>
          <p style={{ fontSize: 14.5, color: 'var(--g-text-dim)', lineHeight: 1.7, marginBottom: 10 }}>
            인스타그램 계정 확인 및 검토 후 승인돼요.<br />보통 <strong style={{ color: 'var(--g-text)' }}>1~2일 이내</strong>에 처리됩니다.
          </p>
          <p style={{ fontSize: 13, color: 'var(--g-text-faint)', marginBottom: 30 }}>승인되면 가입하신 이메일로 바로 로그인할 수 있어요.</p>
          <Link href="/login" style={{ textDecoration: 'none', width: '100%', maxWidth: 320 }}>
            <GlassButton>로그인 화면으로</GlassButton>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dvh-screen glass-screen">
      <GlassPhotoBackground position="center 18%" />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: 'max(56px, env(safe-area-inset-top)) 26px max(34px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 22 }}>
          {step === 1 ? (
            <Link href="/login" aria-label="로그인으로" style={{ display: 'inline-block', marginBottom: 20 }}>
              <GlassIconButton>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </GlassIconButton>
            </Link>
          ) : (
            <div style={{ display: 'inline-block', marginBottom: 20 }}>
              <GlassIconButton ariaLabel="이전 단계로" onClick={() => { setError(''); setStep(1) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </GlassIconButton>
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--g-text)', letterSpacing: '-0.02em' }}>{step === 1 ? '계정 만들기' : '프로필 입력'}</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--g-text-dim)' }}>{step === 1 ? '로그인에 사용할 이메일과 비밀번호를 정해 주세요.' : '활동 정보를 알려주시면 검토 후 승인해 드려요.'}</p>
        </div>

        {/* 스텝 인디케이터 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }} aria-label={`${STEPS.length}단계 중 ${step}단계`}>
          {STEPS.map(s => (
            <div key={s.n} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: step >= s.n ? '#fff' : 'var(--g-border-soft)', transition: 'background .3s' }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: step >= s.n ? 'var(--g-text)' : 'var(--g-text-faint)', marginTop: 6 }}>{s.n}. {s.label}</div>
            </div>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); if (step === 1) goStep2(); else handleSignup() }} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }} noValidate>
          {step === 1 && (
            <div className="au-step" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <GlassInput label="이메일" htmlFor="su-email" type="email" inputMode="email" autoComplete="email"
                autoCapitalize="none" autoCorrect="off" enterKeyHint="next" placeholder="you@siriai.com"
                value={form.email} onChange={e => set('email', e.target.value)} required
                hint={form.email.length > 3 && !emailValid ? '이메일 형식을 확인해 주세요.' : undefined} hintError />
              <div>
                <GlassInput label="비밀번호" htmlFor="su-pw" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="영문+숫자 8자 이상" value={form.password} onChange={e => set('password', e.target.value)} required
                  trailing={<PwToggle show={showPw} onToggle={() => setShowPw(s => !s)} />} />
                <div style={{ display: 'flex', gap: 14, marginTop: 9, paddingLeft: 2 }}>
                  <PwCheck ok={pwLen}>8자 이상</PwCheck>
                  <PwCheck ok={pwAlpha}>영문 포함</PwCheck>
                  <PwCheck ok={pwNum}>숫자 포함</PwCheck>
                </div>
              </div>
              {error && <GlassError>{error}</GlassError>}
              <GlassButton type="submit" disabled={!form.email || !form.password} style={{ marginTop: 'auto' }}>다음</GlassButton>
            </div>
          )}

          {step === 2 && (
            <div className="au-step" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <GlassInput label="이름" htmlFor="su-name" type="text" autoComplete="name" placeholder="홍길동"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
                <GlassInput label="인스타 핸들" htmlFor="su-handle" type="text" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  placeholder="@handle" value={form.handle} onChange={e => set('handle', e.target.value.replace(/^@/, '').toLowerCase())} required />
              </div>
              <div>
                <span style={lbl}>성별 (선택)</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GENDERS.map(g => <button key={g} type="button" onClick={() => set('gender', form.gender === g ? '' : g)} aria-pressed={form.gender === g} style={chip(form.gender === g)}>{g}</button>)}
                </div>
              </div>
              <div>
                <label htmlFor="su-region" style={lbl}>거주지역 (선택)</label>
                <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 16px', borderRadius: 14, background: 'var(--g-field)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--g-border-soft)' }}>
                  <select id="su-region" className="glass-input" value={form.region} onChange={e => set('region', e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, color: form.region ? 'var(--g-text)' : 'var(--g-text-faint)' }}>
                    <option value="">지역 선택</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span style={lbl}>활동 카테고리 (복수 선택)</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => <button key={c} type="button" onClick={() => toggleCat(c)} aria-pressed={categories.includes(c)} style={chip(categories.includes(c))}>{c}</button>)}
                </div>
              </div>
              <div>
                <span style={lbl}>SNS 링크 (선택)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <GlassInput label="" htmlFor="su-yt" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="유튜브 채널 링크" value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} />
                  <GlassInput label="" htmlFor="su-blog" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="블로그 링크" value={form.blog_url} onChange={e => set('blog_url', e.target.value)} />
                  <GlassInput label="" htmlFor="su-tiktok" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="틱톡 링크" value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} />
                </div>
              </div>
              {error && <GlassError>{error}</GlassError>}
              <GlassButton type="submit" disabled={loading || !form.name.trim() || !form.handle.trim()} loading={loading} style={{ marginTop: 'auto' }}>
                {loading ? '신청 중...' : '가입 신청'}
              </GlassButton>
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--g-text-dim)' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" style={{ color: 'var(--g-text)', fontWeight: 700, textDecoration: 'none' }}>로그인</Link>
        </div>
      </div>
    </div>
  )
}
