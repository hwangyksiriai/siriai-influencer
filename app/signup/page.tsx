'use client'

import { useState } from 'react'
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
const chip = (active: boolean): React.CSSProperties => ({
  borderRadius: 100, padding: '10px 16px', fontSize: 14, fontWeight: 600,
  border: active ? '1.5px solid transparent' : '1.5px solid rgba(255,255,255,0.24)',
  cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
  background: active ? '#fff' : 'rgba(255,255,255,0.08)',
  color: active ? '#16140F' : 'rgba(255,255,255,0.82)',
})

const CATEGORIES = ['색조', '스킨케어', '패션', '라이프', '육아', '피트니스']
const GENDERS = ['여성', '남성']
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
const STEPS = [{ n: 1, label: '계정 만들기' }, { n: 2, label: '프로필 입력' }]

// 스킴 없는 링크 입력은 https:// 자동 보정
const normalizeUrl = (v: string) => {
  const s = v.trim()
  if (!s) return null
  return /^https?:\/\//i.test(s) ? s : 'https://' + s
}

// Supabase 영문 에러 → 사용자용 한글 메시지
function signupErrorKo(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) return '이미 가입된 이메일이에요. 로그인해 주세요.'
  if (m.includes('invalid email')) return '이메일 형식이 올바르지 않아요.'
  if (m.includes('password')) return '비밀번호 조건을 확인해 주세요.'
  if (m.includes('rate limit') || m.includes('too many')) return '시도가 너무 많았어요. 잠시 후 다시 시도해 주세요.'
  if (m.includes('network') || m.includes('fetch')) return '네트워크 연결을 확인해 주세요.'
  return '가입에 실패했어요: ' + message
}

// 비밀번호 조건 체크 항목
function PwCheck({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: ok ? '#A8E6BC' : 'rgba(255,255,255,0.45)', transition: 'color .2s' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        {ok
          ? <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          : <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.45" />}
      </svg>
      {children}
    </span>
  )
}

// 에러 박스 (다크 글래스)
function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="au-error" role="alert" style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      background: 'rgba(255,107,92,0.16)', border: '1px solid rgba(255,107,92,0.38)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderRadius: 12, padding: '11px 13px',
    }}>
      <span style={{ fontSize: 13, lineHeight: '19px' }}>⚠️</span>
      <p style={{ fontSize: 13, color: '#FFC4BB', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{children}</p>
    </div>
  )
}

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

    // 이메일 인증 ON 환경에서는 중복 이메일도 에러 없이 identities 빈 배열로 반환됨
    if (data.user && (data.user.identities?.length ?? 1) === 0) {
      setError('이미 가입된 이메일이에요. 로그인해 주세요.')
      setLoading(false)
      return
    }

    if (data.user) {
      const handle = form.handle.trim().replace(/^@/, '')
      const { error: insErr } = await supabase.from('influencers').insert([{
        id: data.user.id,
        name: form.name.trim(),
        handle,
        email: form.email.trim(),
        gender: form.gender || null,
        region: form.region || null,
        category: categories,
        youtube_url: normalizeUrl(form.youtube_url),
        blog_url: normalizeUrl(form.blog_url),
        tiktok_url: normalizeUrl(form.tiktok_url),
        status: 'pending',
      }])
      if (insErr) {
        setError(insErr.message.toLowerCase().includes('duplicate')
          ? '이미 가입된 이메일이에요. 로그인해 주세요.'
          : '프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    setDone(true)
  }

  // 다크 포토 배경 (공통)
  const Background = (
    <>
      <img src={done ? '/brand/done.png' : '/brand/auth.png'} alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,8,0.55) 0%, rgba(10,10,8,0.66) 45%, rgba(10,10,8,0.9) 100%)' }} />
    </>
  )

  // 가입 신청 완료 (검토 대기) 화면
  if (done) {
    return (
      <div className="dvh-screen au-step" style={{
        position: 'relative', background: '#0E0D0B', overflow: 'hidden', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 28px', textAlign: 'center',
      }}>
        {Background}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>가입 신청이 완료됐어요</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 10 }}>
            인스타그램 계정 확인 및 검토 후 승인돼요.<br />보통 <strong style={{ color: '#fff' }}>1~2일 이내</strong>에 처리됩니다.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 30 }}>승인되면 가입하신 이메일로 바로 로그인할 수 있어요.</p>
          <Link href="/login" style={{ textDecoration: 'none', width: '100%', maxWidth: 320 }}>
            <span style={{ display: 'block', width: '100%', background: '#fff', color: '#16140F', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}>
              로그인 화면으로
            </span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dvh-screen" style={{
      position: 'relative', background: '#0E0D0B', overflow: 'hidden', color: '#fff',
      display: 'flex', flexDirection: 'column',
      padding: 'max(24px, env(safe-area-inset-top)) 26px max(28px, env(safe-area-inset-bottom))',
    }}>
      {Background}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ marginBottom: 22 }}>
          {step === 1 ? (
            <Link href="/login" aria-label="로그인으로 돌아가기" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '6px 0', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              로그인
            </Link>
          ) : (
            <button type="button" onClick={() => { setError(''); setStep(1) }} aria-label="이전 단계로"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontWeight: 600, fontFamily: 'inherit' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              이전
            </button>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginTop: 12, marginBottom: 4 }}>
            {step === 1 ? '계정 만들기' : '프로필 입력'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {step === 1 ? '로그인에 사용할 이메일과 비밀번호를 정해 주세요.' : '활동 정보를 알려주시면 검토 후 승인해 드려요.'}
          </p>
        </div>

        {/* 스텝 인디케이터 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }} aria-label={`${STEPS.length}단계 중 ${step}단계`}>
          {STEPS.map(s => (
            <div key={s.n} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: step >= s.n ? '#fff' : 'rgba(255,255,255,0.2)', transition: 'background .3s' }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: step >= s.n ? '#fff' : 'rgba(255,255,255,0.45)', marginTop: 6 }}>{s.n}. {s.label}</div>
            </div>
          ))}
        </div>

        {/* 스텝1에서 Enter → 다음 단계, 스텝2에서 Enter → 가입 신청 */}
        <form onSubmit={e => { e.preventDefault(); if (step === 1) goStep2(); else handleSignup() }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }} noValidate>
          {step === 1 && (
            <div className="au-step" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div>
                <label htmlFor="su-email" style={lbl}>이메일</label>
                <input id="su-email" className="au-dark" style={inp} type="email" inputMode="email" autoComplete="email"
                  autoCapitalize="none" autoCorrect="off" enterKeyHint="next"
                  placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                {form.email.length > 3 && !emailValid && (
                  <p style={{ fontSize: 12, color: '#FFC4BB', margin: '6px 2px 0', fontWeight: 500 }}>이메일 형식을 확인해 주세요.</p>
                )}
              </div>
              <div>
                <label htmlFor="su-pw" style={lbl}>비밀번호</label>
                <div style={{ position: 'relative' }}>
                  <input id="su-pw" className="au-dark" style={{ ...inp, paddingRight: 64 }}
                    type={showPw ? 'text' : 'password'} autoComplete="new-password"
                    placeholder="영문+숫자 8자 이상" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={showPw}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '10px 8px', fontFamily: 'inherit' }}>
                    {showPw ? '숨김' : '보기'}
                  </button>
                </div>
                {/* 실시간 비밀번호 조건 체크 */}
                <div style={{ display: 'flex', gap: 14, marginTop: 9, paddingLeft: 2 }}>
                  <PwCheck ok={pwLen}>8자 이상</PwCheck>
                  <PwCheck ok={pwAlpha}>영문 포함</PwCheck>
                  <PwCheck ok={pwNum}>숫자 포함</PwCheck>
                </div>
              </div>

              {error && <ErrorBox>{error}</ErrorBox>}

              <button type="submit" disabled={!form.email || !form.password}
                style={{
                  background: '#fff', color: '#16140F', borderRadius: 14, padding: '16px', fontSize: 15.5, fontWeight: 700,
                  border: 'none', cursor: !form.email || !form.password ? 'default' : 'pointer', marginTop: 'auto',
                  opacity: !form.email || !form.password ? 0.5 : 1, transition: 'opacity .2s', fontFamily: 'inherit',
                }}>
                다음
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="au-step" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="su-name" style={lbl}>이름</label>
                  <input id="su-name" className="au-dark" style={inp} type="text" autoComplete="name"
                    placeholder="홍길동" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="su-handle" style={lbl}>인스타 핸들</label>
                  <div style={{ position: 'relative' }}>
                    <span aria-hidden style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>@</span>
                    <input id="su-handle" className="au-dark" style={{ ...inp, paddingLeft: 36 }} type="text" autoComplete="off"
                      autoCapitalize="none" autoCorrect="off" spellCheck={false}
                      placeholder="my_handle" value={form.handle} onChange={e => set('handle', e.target.value.replace(/^@/, '').toLowerCase())} required />
                  </div>
                </div>
              </div>
              <div>
                <span style={lbl}>성별 (선택)</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => set('gender', form.gender === g ? '' : g)}
                      aria-pressed={form.gender === g} style={chip(form.gender === g)}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="su-region" style={lbl}>거주지역 (선택)</label>
                <select id="su-region" className="au-dark" style={{ ...inp, color: form.region ? '#fff' : 'rgba(255,255,255,0.42)' }} value={form.region} onChange={e => set('region', e.target.value)}>
                  <option value="">지역 선택</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <span style={lbl}>활동 카테고리 (복수 선택)</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => toggleCat(c)}
                      aria-pressed={categories.includes(c)} style={chip(categories.includes(c))}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <span style={lbl}>SNS 링크 (선택)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="au-dark" style={inp} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="유튜브 채널 링크" value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} />
                  <input className="au-dark" style={inp} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="블로그 링크" value={form.blog_url} onChange={e => set('blog_url', e.target.value)} />
                  <input className="au-dark" style={inp} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="틱톡 링크" value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} />
                </div>
              </div>

              {error && <ErrorBox>{error}</ErrorBox>}

              <button type="submit" disabled={loading || !form.name.trim() || !form.handle.trim()}
                style={{
                  background: '#fff', color: '#16140F', borderRadius: 14, padding: '16px', fontSize: 15.5, fontWeight: 700,
                  border: 'none', cursor: loading || !form.name.trim() || !form.handle.trim() ? 'default' : 'pointer', marginTop: 'auto',
                  opacity: loading || !form.name.trim() || !form.handle.trim() ? 0.5 : 1, transition: 'opacity .2s', fontFamily: 'inherit',
                }}>
                {loading && <span className="au-spinner-dark" aria-hidden />}
                {loading ? '신청 중...' : '가입 신청'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
