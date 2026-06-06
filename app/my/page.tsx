'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

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
  width: '100%', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.18)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#211A33',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const secCard: React.CSSProperties = { background: 'rgba(255,255,255,.5)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 14, overflow: 'hidden' }
const secBtn: React.CSSProperties = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: '15px 16px', fontSize: 14, fontWeight: 700, color: '#211A33', cursor: 'pointer', fontFamily: 'inherit' }
const secBody: React.CSSProperties = { padding: '0 16px 18px' }
const microLbl: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(33,26,51,.4)', display: 'block', marginBottom: 6 }

const statusLabel: Record<string, string> = { pending: '지급예정', paid: '지급완료', cancelled: '취소' }
const statusColor: Record<string, string> = { pending: '#e65100', paid: '#2e7d32', cancelled: 'rgba(33,26,51,.4)' }
const BANKS = ['카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', 'SC제일은행', '씨티은행', '새마을금고', '우체국', '부산은행', '대구은행', '광주은행', '경남은행', '전북은행', '수협은행', '케이뱅크']

export default function MyPage() {
  const router = useRouter()
  const [inf, setInf] = useState<Influencer | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [tab, setTab] = useState<'profile' | 'settlement'>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [rrn, setRrn] = useState('')
  const [openSec, setOpenSec] = useState<Record<string, boolean>>({ basic: true, rate: false, account: false })
  const toggleSec = (k: string) => setOpenSec(s => ({ ...s, [k]: !s[k] }))

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const uid = data.session.user.id
      const { data: influencer } = await supabase.from('influencers').select('*').eq('id', uid).single()
      if (influencer) setInf(influencer as Influencer)
      const { data: sec } = await supabase.from('influencer_secure').select('rrn').eq('influencer_id', uid).limit(1)
      if (sec && sec[0]) setRrn(sec[0].rrn || '')
      const { data: setts } = await supabase
        .from('settlements')
        .select('*, submissions(applications(campaigns(name)))')
        .eq('influencer_id', uid)
        .order('created_at', { ascending: false })
      setSettlements((setts as Settlement[]) || [])
    })
  }, [])

  const set = (k: string, v: any) => setInf(i => i ? { ...i, [k]: v } : i)

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !inf) return
    const ext = file.name.split('.').pop()
    const path = `avatars/${inf.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('campaign-files').upload(path, file, { upsert: true })
    if (error) { alert('사진 업로드 실패: ' + error.message); return }
    const { data } = supabase.storage.from('campaign-files').getPublicUrl(path)
    set('avatar_url', data.publicUrl)
    await supabase.from('influencers').update({ avatar_url: data.publicUrl }).eq('id', inf.id)
  }

  async function handleSave() {
    if (!inf) return
    setSaving(true)
    await supabase.from('influencers').update({
      name: inf.name, handle: inf.handle, phone: inf.phone, avatar_url: inf.avatar_url,
      bank_name: inf.bank_name, bank_account: inf.bank_account, account_holder: inf.account_holder,
      ig_feed_min: inf.ig_feed_min, ig_feed_max: inf.ig_feed_max,
      ig_reels_min: inf.ig_reels_min, ig_reels_max: inf.ig_reels_max,
      yt_shorts_min: inf.yt_shorts_min, yt_shorts_max: inf.yt_shorts_max,
      yt_video_min: inf.yt_video_min, yt_video_max: inf.yt_video_max,
    }).eq('id', inf.id)
    await supabase.from('influencer_secure').upsert({ influencer_id: inf.id, rrn }, { onConflict: 'influencer_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const totalPending = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.amount || 0), 0)
  const totalPaid = settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.amount || 0), 0)

  if (!inf) return <div style={{ minHeight: '100vh', background: '#F3EEE2' }}><BottomNav /></div>

  const phoneParts = (inf.phone || '').split('-')
  const setPhonePart = (idx: number, val: string) => {
    const p = (inf.phone || '').split('-'); while (p.length < 3) p.push('')
    p[idx] = val.replace(/[^0-9]/g, '')
    set('phone', p.join('-'))
  }
  const rrnParts = (rrn || '').split('-')
  const setRrnPart = (idx: number, val: string) => {
    const p = (rrn || '').split('-'); while (p.length < 2) p.push('')
    p[idx] = val.replace(/[^0-9]/g, '')
    setRrn(p.join('-'))
  }

  const chevron = (open: boolean) => (
    <span style={{ fontSize: 18, color: 'rgba(33,26,51,.35)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', lineHeight: 1 }}>⌄</span>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 80 }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 20px 0', borderBottom: '1px solid rgba(33,26,51,.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>마이</h1>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontSize: 12, color: 'rgba(33,26,51,.4)', cursor: 'pointer' }}>로그아웃</button>
        </div>

        {/* 프로필 요약 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <label style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(33,26,51,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }} title="프로필 사진 변경">
            <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            {inf.avatar_url ? <img src={inf.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🙋'}
          </label>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>{inf.name}</p>
            <p style={{ fontSize: 13, color: 'rgba(33,26,51,.5)', marginTop: 2 }}>@{inf.handle} · {inf.followers?.toLocaleString()}명</p>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {(inf.category || []).map(c => (
                <span key={c} style={{ background: 'rgba(33,26,51,.08)', borderRadius: 100, padding: '2px 8px', fontSize: 10, color: 'rgba(33,26,51,.6)' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[['profile', '프로필 편집'], ['settlement', '정산 내역']] .map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              style={{ background: 'none', border: 'none', borderBottom: tab === k ? '2px solid #211A33' : '2px solid transparent', padding: '8px 14px', fontSize: 13, fontWeight: tab === k ? 700 : 500, color: tab === k ? '#211A33' : 'rgba(33,26,51,.4)', cursor: 'pointer', marginBottom: -1 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding: '20px 20px' }}>
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 섹션 1: 기본 정보 */}
            <div style={secCard}>
              <button type="button" style={secBtn} onClick={() => toggleSec('basic')}>
                <span>기본 정보</span>{chevron(openSec.basic)}
              </button>
              {openSec.basic && (
                <div style={secBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={microLbl}>이름</label>
                      <input style={inp} type="text" value={inf.name || ''} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div>
                      <label style={microLbl}>인스타 핸들</label>
                      <input style={inp} type="text" value={inf.handle || ''} onChange={e => set('handle', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={microLbl}>연락처</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input style={{ ...inp, textAlign: 'center' }} inputMode="numeric" maxLength={3} placeholder="010" value={phoneParts[0] || ''} onChange={e => setPhonePart(0, e.target.value)} />
                      <span style={{ color: 'rgba(33,26,51,.3)' }}>-</span>
                      <input style={{ ...inp, textAlign: 'center' }} inputMode="numeric" maxLength={4} placeholder="0000" value={phoneParts[1] || ''} onChange={e => setPhonePart(1, e.target.value)} />
                      <span style={{ color: 'rgba(33,26,51,.3)' }}>-</span>
                      <input style={{ ...inp, textAlign: 'center' }} inputMode="numeric" maxLength={4} placeholder="0000" value={phoneParts[2] || ''} onChange={e => setPhonePart(2, e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 섹션 2: 협업 단가 */}
            <div style={secCard}>
              <button type="button" style={secBtn} onClick={() => toggleSec('rate')}>
                <span>협업 단가</span>{chevron(openSec.rate)}
              </button>
              {openSec.rate && (
                <div style={secBody}>
                  <p style={{ fontSize: 12, color: 'rgba(33,26,51,.5)', lineHeight: 1.5, marginBottom: 12 }}>희망 협업 단가를 자유롭게 입력해 주세요. 매칭 시 참고합니다. (단위: 만원)</p>
                  {[
                    { label: '인스타 피드', minK: 'ig_feed_min', maxK: 'ig_feed_max' },
                    { label: '인스타 릴스', minK: 'ig_reels_min', maxK: 'ig_reels_max' },
                    { label: '유튜브 쇼츠', minK: 'yt_shorts_min', maxK: 'yt_shorts_max' },
                    { label: '유튜브 롱폼', minK: 'yt_video_min', maxK: 'yt_video_max' },
                  ].map(f => (
                    <div key={f.minK} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'rgba(33,26,51,.6)', minWidth: 90 }}>{f.label}</span>
                      <input style={{ ...inp, width: 64, padding: '9px 10px', textAlign: 'right' }} type="number"
                        value={(inf as any)[f.minK] || ''} onChange={e => set(f.minK, e.target.value)} />
                      <span style={{ color: 'rgba(33,26,51,.3)' }}>–</span>
                      <input style={{ ...inp, width: 64, padding: '9px 10px', textAlign: 'right' }} type="number"
                        value={(inf as any)[f.maxK] || ''} onChange={e => set(f.maxK, e.target.value)} />
                      <span style={{ fontSize: 12, color: 'rgba(33,26,51,.4)' }}>만원</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 섹션 3: 정산 계좌 */}
            <div style={secCard}>
              <button type="button" style={secBtn} onClick={() => toggleSec('account')}>
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
                        <input style={{ ...inp, textAlign: 'center' }} inputMode="numeric" maxLength={6} placeholder="앞 6자리" value={rrnParts[0] || ''} onChange={e => setRrnPart(0, e.target.value)} />
                        <span style={{ color: 'rgba(33,26,51,.3)' }}>-</span>
                        <input style={{ ...inp, textAlign: 'center' }} inputMode="numeric" type="password" maxLength={7} placeholder="뒤 7자리" value={rrnParts[1] || ''} onChange={e => setRrnPart(1, e.target.value)} />
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(33,26,51,.4)', marginTop: 5, lineHeight: 1.5 }}>🔒 정산 세금 신고에만 사용하며, 본인과 정산 담당자만 볼 수 있어요.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', background: '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? .6 : 1, marginTop: 4 }}>
              {saved ? '저장됐어요 ✓' : saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}

        {tab === 'settlement' && (
          <div>
            {/* 요약 */}
            <div style={{ background: '#211A33', borderRadius: 14, padding: '18px', color: '#F3EEE2', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>지급 예정</p>
              <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>{totalPending.toLocaleString()}원</p>
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
            </div>

            {/* 내역 */}
            {settlements.length === 0 ? (
              <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)', textAlign: 'center', padding: '40px 0' }}>정산 내역이 없어요.</p>
            ) : (
              settlements.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid rgba(33,26,51,.07)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#211A33', marginBottom: 3 }}>{s.submissions?.applications?.campaigns?.name || '캠페인'}</p>
                    <p style={{ fontSize: 11, color: 'rgba(33,26,51,.4)' }}>{s.paid_at ? new Date(s.paid_at).toLocaleDateString('ko-KR') : '-'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#211A33', marginBottom: 3 }}>{s.amount?.toLocaleString()}원</p>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[s.status] }}>{statusLabel[s.status]}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
