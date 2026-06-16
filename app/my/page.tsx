'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T } from '@/lib/theme'
import { Ico, Pill, Card, Chip, Avatar } from '@/components/ui'

interface Influencer {
  id: string
  name: string
  handle: string
  followers: number
  category: string[]
  email: string
  phone: string
  bank_name: string
  bank_account: string
  account_holder: string
  avatar_url: string
  status: string
  notify_kakao: boolean
  notify_push: boolean
  ig_feed_min: number
  ig_feed_max: number
  ig_reels_min: number
  ig_reels_max: number
  yt_shorts_min: number
  yt_shorts_max: number
  yt_video_min: number
  yt_video_max: number
}

interface Settlement {
  id: string
  amount: number
  status: string
  paid_at: string
  submissions: { applications: { campaigns: { name: string } } }
}

const inp: React.CSSProperties = {
  width: '100%', background: T.surface2, border: `1px solid ${T.line}`,
  borderRadius: T.radiusSm, padding: '11px 14px', fontSize: 16, color: T.ink,
  fontFamily: T.fontUI, outline: 'none', boxSizing: 'border-box',
}
const secBtn: React.CSSProperties = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, fontSize: 14.5, fontWeight: 700, color: T.ink, cursor: 'pointer', fontFamily: T.fontUI }
const secBody: React.CSSProperties = { paddingTop: 14 }
const microLbl: React.CSSProperties = { fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, color: T.ink3, display: 'block', marginBottom: 6 }
// 로딩 스켈레톤 공통 스타일 (T.surface2 펄스)
const skel: React.CSSProperties = { background: T.surface2, borderRadius: 10, animation: 'my-skel-pulse 1.4s ease-in-out infinite' }

const statusLabel: Record<string, string> = { pending: '지급예정', paid: '지급완료', cancelled: '취소' }
const statusColor: Record<string, string> = { pending: T.butterInk, paid: T.ok, cancelled: T.ink3 }
const BANKS = ['카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', 'SC제일은행', '씨티은행', '새마을금고', '우체국', '부산은행', '대구은행', '광주은행', '경남은행', '전북은행', '수협은행', '케이뱅크']

// 분할 입력 자릿수 (자동 포커스 이동용)
const PHONE_MAX = [3, 4, 4]
const RRN_MAX = [6, 7]

export default function MyPage() {
  const router = useRouter()
  const [inf, setInf] = useState<Influencer | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [tab, setTab] = useState<'profile' | 'settlement' | 'settings'>('profile')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [rrn, setRrn] = useState('')
  const [openSec, setOpenSec] = useState<Record<string, boolean>>({ basic: true, rate: false, account: false })
  const toggleSec = (k: string) => setOpenSec(s => ({ ...s, [k]: !s[k] }))
  // 분할 입력 자동 포커스용 ref
  const phoneRefs = useRef<(HTMLInputElement | null)[]>([])
  const rrnRefs = useRef<(HTMLInputElement | null)[]>([])

  async function load() {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    if (!data.session) { router.replace('/login'); return }
    const uid = data.session.user.id
    // 관리자 전용 항목(admin_memo·blacklisted 등)은 가져오지 않음
    const { data: influencer, error: infError } = await supabase.from('influencers')
      .select('id, name, handle, followers, category, email, phone, bank_name, bank_account, account_holder, avatar_url, status, notify_kakao, notify_push, ig_feed_min, ig_feed_max, ig_reels_min, ig_reels_max, yt_shorts_min, yt_shorts_max, yt_video_min, yt_video_max')
      .eq('id', uid).single()
    if (infError || !influencer) { setInf(null); setLoading(false); return }
    setInf(influencer as Influencer)
    try {
      const res = await fetch('/api/rrn', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
      if (res.ok) { const j = await res.json(); setRrn(j.rrn || '') }
    } catch { /* 주민번호 미입력 상태 */ }
    const { data: setts } = await supabase
      .from('settlements')
      .select('*, submissions(applications(campaigns(name)))')
      .eq('influencer_id', uid)
      .order('created_at', { ascending: false })
    setSettlements((setts as Settlement[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setInf(i => i ? { ...i, [k]: v } : i)

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !inf) return
    setAvatarMsg('')
    // 이미지 타입 · 5MB 검증
    if (!file.type.startsWith('image/')) { setAvatarMsg('이미지 파일만 업로드할 수 있어요.'); e.target.value = ''; return }
    if (file.size > 5 * 1024 * 1024) { setAvatarMsg('5MB 이하의 이미지만 업로드할 수 있어요.'); e.target.value = ''; return }
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${inf.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('campaign-files').upload(path, file, { upsert: true })
    if (error) { setAvatarUploading(false); setAvatarMsg('사진 업로드에 실패했어요. 다시 시도해 주세요.'); return }
    const { data } = supabase.storage.from('campaign-files').getPublicUrl(path)
    const { error: updError } = await supabase.from('influencers').update({ avatar_url: data.publicUrl }).eq('id', inf.id)
    setAvatarUploading(false)
    if (updError) { setAvatarMsg('사진 저장에 실패했어요. 다시 시도해 주세요.'); return }
    set('avatar_url', data.publicUrl)
  }

  async function handleSave() {
    if (!inf) return
    setSaving(true)
    setSaveError('')
    const { error: updError } = await supabase.from('influencers').update({
      name: inf.name, handle: inf.handle, phone: inf.phone, avatar_url: inf.avatar_url,
      bank_name: inf.bank_name, bank_account: inf.bank_account, account_holder: inf.account_holder,
      ig_feed_min: inf.ig_feed_min, ig_feed_max: inf.ig_feed_max,
      ig_reels_min: inf.ig_reels_min, ig_reels_max: inf.ig_reels_max,
      yt_shorts_min: inf.yt_shorts_min, yt_shorts_max: inf.yt_shorts_max,
      yt_video_min: inf.yt_video_min, yt_video_max: inf.yt_video_max,
    }).eq('id', inf.id)
    let secError: unknown = null
    try {
      const { data: s } = await supabase.auth.getSession()
      const res = await fetch('/api/rrn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token ?? ''}` },
        body: JSON.stringify({ rrn }),
      })
      if (!res.ok) secError = await res.json().catch(() => ({}))
    } catch (e) { secError = e }
    setSaving(false)
    if (updError || secError) { setSaveError('저장에 실패했어요. 다시 시도해 주세요.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function toggleNotify(key: 'notify_kakao' | 'notify_push', val: boolean) {
    if (!inf) return
    const prev = (inf as any)[key]
    set(key, val)
    const { error } = await supabase.from('influencers').update({ [key]: val }).eq('id', inf.id)
    if (error) set(key, prev) // 실패 시 롤백
  }

  async function handleWithdraw() {
    if (!inf) return
    if (!confirm('정말 탈퇴하시겠어요? 진행 중인 캠페인이나 미지급 정산이 있으면 먼저 처리해 주세요.')) return
    setWithdrawError('')
    const { error } = await supabase.from('influencers').update({ status: 'withdrawn' }).eq('id', inf.id)
    if (error) { setWithdrawError('탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.'); return }
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const totalPending = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.amount || 0), 0)
  const totalPaid = settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.amount || 0), 0)

  // 로딩 중: 프로필 카드 모양 스켈레톤
  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120, maxWidth: 480, margin: '0 auto' }}>
      <style>{'@keyframes my-skel-pulse{0%,100%{opacity:1}50%{opacity:.45}}'}</style>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ ...skel, width: 64, height: 30, marginBottom: 16 }} />
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: T.cardPad, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ ...skel, width: 66, height: 66, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...skel, width: '55%', height: 20, marginBottom: 8 }} />
              <div style={{ ...skel, width: '38%', height: 13 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
            {[0, 1, 2].map(i => <div key={i} style={{ ...skel, flex: 1, height: 36 }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ ...skel, width: 84, height: 34, borderRadius: 100 }} />)}
        </div>
      </div>
      <BottomNav />
    </div>
  )

  // 조회 실패 / 데이터 없음 — 프로필이 안 떠도 로그아웃은 가능해야 함
  if (!inf) return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '90px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: T.fontUI, fontSize: 14.5, color: T.ink2, marginBottom: 14 }}>프로필을 불러오지 못했어요</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={load}
            style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: T.radiusSm, padding: '12px 24px', fontSize: 14, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer' }}>
            다시 시도
          </button>
          <button onClick={handleLogout} disabled={loggingOut}
            style={{ background: T.surface, color: T.ink, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: '12px 24px', fontSize: 14, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer', opacity: loggingOut ? 0.6 : 1 }}>
            {loggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  const phoneParts = (inf.phone || '').split('-')
  const setPhonePart = (idx: number, val: string) => {
    const p = (inf.phone || '').split('-'); while (p.length < 3) p.push('')
    const cleaned = val.replace(/[^0-9]/g, '')
    p[idx] = cleaned
    set('phone', p.join('-'))
    // 자릿수 채우면 다음 칸 자동 포커스
    if (cleaned.length >= PHONE_MAX[idx] && idx < PHONE_MAX.length - 1) phoneRefs.current[idx + 1]?.focus()
  }
  const rrnParts = (rrn || '').split('-')
  const setRrnPart = (idx: number, val: string) => {
    const p = (rrn || '').split('-'); while (p.length < 2) p.push('')
    const cleaned = val.replace(/[^0-9]/g, '')
    p[idx] = cleaned
    setRrn(p.join('-'))
    if (cleaned.length >= RRN_MAX[idx] && idx < RRN_MAX.length - 1) rrnRefs.current[idx + 1]?.focus()
  }

  const chevron = (open: boolean) => (
    <Ico.chevD width="18" height="18" style={{ color: T.ink3, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120, maxWidth: 480, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 30, fontFamily: T.fontDisplay, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.04 }}>마이</h1>
          {/* 로그아웃 — 항상 보이는 진입점 (탭과 무관) */}
          <button type="button" onClick={() => setConfirmLogout(true)} aria-label="로그아웃"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 100, border: `1px solid ${T.line}`, background: T.surface, color: T.ink2, fontSize: 13, fontWeight: 600, fontFamily: T.fontUI, cursor: 'pointer' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></svg>
            로그아웃
          </button>
        </div>

        {/* 프로필 카드 */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <label style={{ cursor: 'pointer', flexShrink: 0, position: 'relative', display: 'block' }} title="프로필 사진 변경">
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={avatarUploading} style={{ display: 'none' }} />
              <Avatar
                tint={T.blush}
                size={66}
                ring
                emoji={inf.avatar_url
                  ? <img src={inf.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🙆‍♀️'}
              />
              {avatarUploading && (
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="au-spinner" style={{ margin: 0 }} />
                </span>
              )}
            </label>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 22, color: T.ink, letterSpacing: '-0.02em' }}>{inf.name}</span>
                {(inf.category || []).map(c => (
                  <Pill key={c} bg={T.blush} ink={T.blushInk} size={11}>{c}</Pill>
                ))}
              </div>
              <div style={{ fontFamily: T.fontUI, fontSize: 13, color: T.ink2, marginTop: 3 }}>@{inf.handle}</div>
            </div>
          </div>
          {avatarMsg && <p className="au-error" style={{ fontSize: 11.5, color: T.danger, marginTop: 8 }}>{avatarMsg}</p>}
          <div style={{ display: 'flex', marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
            {[
              ['팔로워', inf.followers?.toLocaleString() ?? '0'],
              ['카테고리', `${inf.category?.length ?? 0}개`],
              ['정산건수', `${settlements.length}건`],
            ].map(([l, v], i) => (
              <div key={l} style={{ flex: 1, textAlign: 'center', borderLeft: i ? `1px solid ${T.line}` : 'none' }}>
                <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 20, color: T.ink, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([['profile', '프로필 편집'], ['settlement', '정산 내역'], ['settings', '설정']] as const).map(([k, l]) => (
            <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Chip>
          ))}
        </div>
      </div>

      <main style={{ padding: '16px 20px' }}>
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 섹션 1: 기본 정보 */}
            <Card>
              <button type="button" style={secBtn} aria-expanded={openSec.basic} onClick={() => toggleSec('basic')}>
                <span>기본 정보</span>{chevron(openSec.basic)}
              </button>
              {openSec.basic && (
                <div style={secBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={microLbl}>이름</label>
                      <input style={inp} type="text" autoComplete="name" value={inf.name || ''} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div>
                      <label style={microLbl}>인스타 핸들</label>
                      <input style={inp} type="text" value={inf.handle || ''} onChange={e => set('handle', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={microLbl}>연락처</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input ref={el => { phoneRefs.current[0] = el }} style={{ ...inp, textAlign: 'center' }} inputMode="numeric" autoComplete="tel" maxLength={3} placeholder="010" value={phoneParts[0] || ''} onChange={e => setPhonePart(0, e.target.value)} />
                      <span style={{ color: T.ink3 }}>-</span>
                      <input ref={el => { phoneRefs.current[1] = el }} style={{ ...inp, textAlign: 'center' }} inputMode="numeric" autoComplete="tel" maxLength={4} placeholder="0000" value={phoneParts[1] || ''} onChange={e => setPhonePart(1, e.target.value)} />
                      <span style={{ color: T.ink3 }}>-</span>
                      <input ref={el => { phoneRefs.current[2] = el }} style={{ ...inp, textAlign: 'center' }} inputMode="numeric" autoComplete="tel" maxLength={4} placeholder="0000" value={phoneParts[2] || ''} onChange={e => setPhonePart(2, e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 섹션 2: 협업 단가 */}
            <Card>
              <button type="button" style={secBtn} aria-expanded={openSec.rate} onClick={() => toggleSec('rate')}>
                <span>협업 단가</span>{chevron(openSec.rate)}
              </button>
              {openSec.rate && (
                <div style={secBody}>
                  <p style={{ fontSize: 12, color: T.ink2, lineHeight: 1.5, marginBottom: 12 }}>희망 협업 단가를 자유롭게 입력해 주세요. 매칭 시 참고합니다. (단위: 만원)</p>
                  {[
                    { label: '인스타 피드', minK: 'ig_feed_min', maxK: 'ig_feed_max' },
                    { label: '인스타 릴스', minK: 'ig_reels_min', maxK: 'ig_reels_max' },
                    { label: '유튜브 쇼츠', minK: 'yt_shorts_min', maxK: 'yt_shorts_max' },
                    { label: '유튜브 롱폼', minK: 'yt_video_min', maxK: 'yt_video_max' },
                  ].map(f => (
                    <div key={f.minK} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: T.ink2, minWidth: 90 }}>{f.label}</span>
                      <input style={{ ...inp, width: 64, padding: '9px 10px', textAlign: 'right' }} type="number"
                        value={(inf as any)[f.minK] || ''} onChange={e => set(f.minK, e.target.value)} />
                      <span style={{ color: T.ink3 }}>–</span>
                      <input style={{ ...inp, width: 64, padding: '9px 10px', textAlign: 'right' }} type="number"
                        value={(inf as any)[f.maxK] || ''} onChange={e => set(f.maxK, e.target.value)} />
                      <span style={{ fontSize: 12, color: T.ink3 }}>만원</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 섹션 3: 정산 계좌 */}
            <Card>
              <button type="button" style={secBtn} aria-expanded={openSec.account} onClick={() => toggleSec('account')}>
                <span>정산 계좌 · 세금정보</span>{chevron(openSec.account)}
              </button>
              {openSec.account && (
                <div style={secBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={microLbl}>은행</label>
                        <select style={inp} value={inf.bank_name || ''} onChange={e => set('bank_name', e.target.value)}>
                          <option value="">은행 선택</option>
                          {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={microLbl}>예금주</label>
                        <input style={inp} type="text" placeholder="홍길동" value={inf.account_holder || ''} onChange={e => set('account_holder', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label style={microLbl}>계좌번호</label>
                      <input style={inp} type="text" placeholder="계좌번호 입력" value={inf.bank_account || ''} onChange={e => set('bank_account', e.target.value)} />
                    </div>
                    <div>
                      <label style={microLbl}>주민등록번호 (정산 세금 신고용)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input ref={el => { rrnRefs.current[0] = el }} style={{ ...inp, textAlign: 'center' }} inputMode="numeric" autoComplete="off" maxLength={6} placeholder="앞 6자리" value={rrnParts[0] || ''} onChange={e => setRrnPart(0, e.target.value)} />
                        <span style={{ color: T.ink3 }}>-</span>
                        <input ref={el => { rrnRefs.current[1] = el }} style={{ ...inp, textAlign: 'center' }} inputMode="numeric" type="password" autoComplete="off" maxLength={7} placeholder="뒤 7자리" value={rrnParts[1] || ''} onChange={e => setRrnPart(1, e.target.value)} />
                      </div>
                      <p style={{ fontSize: 11, color: T.ink3, marginTop: 5, lineHeight: 1.5 }}>🔒 정산 세금 신고에만 사용하며, 본인과 정산 담당자만 볼 수 있어요.</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {saveError && <p className="au-error" style={{ fontSize: 12.5, color: T.danger, textAlign: 'center', marginTop: 4 }}>{saveError}</p>}
            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', background: T.accent, color: T.accentInk, border: 'none', borderRadius: T.radiusSm, padding: '16px', fontSize: 15, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer', opacity: saving ? .6 : 1, marginTop: 4 }}>
              {saved ? '저장됐어요 ✓' : saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}

        {tab === 'settlement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 요약 */}
            <Card style={{ background: T.accent, border: 'none', color: T.accentInk }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>지급 예정</p>
              <p style={{ fontSize: 30, fontFamily: T.fontDisplay, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 14 }}>{totalPending.toLocaleString()}원</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.15)' }}>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>지급 완료</p>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{totalPaid.toLocaleString()}원</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>총 건수</p>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{settlements.length}건</p>
                </div>
              </div>
            </Card>

            {/* 내역 */}
            {settlements.length === 0 ? (
              <p style={{ fontSize: 14, color: T.ink2, textAlign: 'center', padding: '40px 0' }}>정산 내역이 없어요.</p>
            ) : (
              <Card pad={false}>
                {settlements.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: `14px ${T.cardPad}px`, borderTop: i ? `1px solid ${T.line}` : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 3 }}>{s.submissions?.applications?.campaigns?.name || '캠페인'}</p>
                      <p style={{ fontSize: 11, color: T.ink3 }}>{s.paid_at ? new Date(s.paid_at).toLocaleDateString('ko-KR') : '-'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 3 }}>{s.amount?.toLocaleString()}원</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[s.status] }}>{statusLabel[s.status]}</span>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 메뉴 */}
            <Card pad={false}>
              {([
                ['/messages', '메시지 (담당자 1:1)', Ico.chat],
                ['/support?tab=notice', '공지사항', Ico.bell],
                ['/support?tab=faq', '자주 묻는 질문', Ico.doc],
                ['/support?tab=inquiry', '1:1 문의', Ico.heart],
                ['/support?tab=guide', '이용 가이드', Ico.gear],
              ] as const).map(([href, label, I], i, arr) => (
                <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: `16px ${T.cardPad}px`, textDecoration: 'none', color: T.ink, borderBottom: i < arr.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink2, flexShrink: 0 }}><I width="19" height="19" /></div>
                  <span style={{ flex: 1, fontFamily: T.fontUI, fontSize: 14.5, color: T.ink, fontWeight: 500 }}>{label}</span>
                  <Ico.chevR width="17" height="17" style={{ color: T.ink3 }} />
                </Link>
              ))}
            </Card>

            {/* 계정 정보 */}
            <div>
              <p style={microLbl}>계정 정보</p>
              <Card style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}><span style={{ color: T.ink2 }}>이메일</span><span style={{ color: T.ink }}>{inf.email || '-'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: `1px solid ${T.line}` }}><span style={{ color: T.ink2 }}>회원 상태</span><span style={{ color: T.ink }}>{({ pending: '승인대기', approved: '승인됨', rejected: '반려', withdrawn: '탈퇴' } as Record<string, string>)[inf.status] || '승인됨'}</span></div>
              </Card>
            </div>

            {/* 알림 설정 */}
            <div>
              <p style={microLbl}>알림 설정</p>
              <Card style={{ padding: '4px 16px' }}>
                {([['notify_kakao', '카카오 알림톡'], ['notify_push', '앱 푸시 알림']] as const).map(([k, l], i) => {
                  const on = (inf as any)[k] !== false
                  return (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderTop: i ? `1px solid ${T.line}` : 'none' }}>
                      <span style={{ fontSize: 14, color: T.ink }}>{l}</span>
                      <button onClick={() => toggleNotify(k, !on)} role="switch" aria-checked={on} aria-label={l}
                        style={{ width: 44, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer', background: on ? T.accent : T.line, position: 'relative', transition: 'background .2s' }}>
                        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                      </button>
                    </div>
                  )
                })}
              </Card>
              <p style={{ fontSize: 11, color: T.ink3, marginTop: 6, lineHeight: 1.5 }}>선정·업로드·정산 안내를 받아요. (카카오 알림톡 연동 준비 중)</p>
            </div>

            {/* 로그아웃 / 탈퇴 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <button onClick={() => setConfirmLogout(true)} style={{ width: '100%', background: T.surface, color: T.ink, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: '14px', fontSize: 14, fontWeight: 600, fontFamily: T.fontUI, cursor: 'pointer' }}>로그아웃</button>
              <button onClick={handleWithdraw} style={{ width: '100%', background: 'none', color: T.ink3, border: 'none', padding: '8px', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>회원 탈퇴</button>
              {withdrawError && <p className="au-error" style={{ fontSize: 12, color: T.danger, textAlign: 'center' }}>{withdrawError}</p>}
            </div>
          </div>
        )}
      </main>

      {/* 로그아웃 확인 다이얼로그 */}
      {confirmLogout && (
        <div role="dialog" aria-modal="true" aria-label="로그아웃 확인"
          onClick={() => !loggingOut && setConfirmLogout(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(20,18,28,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, background: T.surface, borderRadius: '24px 24px 0 0', padding: '24px 22px max(24px, env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: T.ink2 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></svg>
            </div>
            <p style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em', margin: '0 0 6px' }}>로그아웃 할까요?</p>
            <p style={{ textAlign: 'center', fontSize: 13.5, color: T.ink2, lineHeight: 1.55, margin: '0 0 22px' }}>다시 이용하려면 이메일로 로그인하면 돼요.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmLogout(false)} disabled={loggingOut}
                style={{ flex: 1, background: T.surface, color: T.ink, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: '15px', fontSize: 14.5, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer' }}>
                취소
              </button>
              <button type="button" onClick={handleLogout} disabled={loggingOut}
                style={{ flex: 1, background: T.danger, color: '#fff', border: 'none', borderRadius: T.radiusSm, padding: '15px', fontSize: 14.5, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer', opacity: loggingOut ? 0.6 : 1 }}>
                {loggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
