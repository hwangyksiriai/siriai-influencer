'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Ico, Pill, IconBtn } from '@/components/ui'
import { T, PHOTO, CAT, catKey, won } from '@/lib/theme'

interface Campaign {
  id: string
  name: string
  fee: string
  fee_amount: number
  product_value: number
  image_url: string
  category: string[] | string
  content_type: string
  upload_start: string
  upload_end: string
  collab_required: boolean
  second_use_required: boolean
  brands: { name: string }
}

interface AppRow { id: string; status: string; campaigns: { name: string; upload_start: string; upload_end: string } | null }
interface Noti { icon: string; title: string; body: string; href: string }

const CATEGORY_FILTERS = ['전체', '색조', '스킨케어', '패션', '라이프', '육아', '피트니스']

function dday(dateStr?: string): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function CampaignCard({ c, onOpen }: { c: Campaign; onOpen: () => void }) {
  const k = catKey(c.category)
  const [label, chipBg, chipInk] = CAT[k] || CAT.default
  const mono = (c.brands?.name || '?').charAt(0)
  const reward = c.fee_amount || c.product_value || 0
  const d = dday(c.upload_end)
  return (
    <div onClick={onOpen} style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.line}`, boxShadow: '0 1px 2px rgba(20,20,20,0.03)', overflow: 'hidden', cursor: 'pointer' }}>
      {/* 비주얼 */}
      <div style={{ position: 'relative', height: 150, background: PHOTO[k] || PHOTO.default }}>
        {c.image_url && <img src={c.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.06) 70%, rgba(0,0,0,0.16))' }} />
        {!c.image_url && <span style={{ position: 'absolute', right: 14, bottom: 6, fontFamily: T.fontDisplay, fontSize: 54, fontWeight: 600, color: 'rgba(255,255,255,0.32)', letterSpacing: '-0.03em', lineHeight: 1 }}>{mono}</span>}
        <div style={{ position: 'absolute', inset: 0, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Pill bg="rgba(255,255,255,0.9)" ink={T.ink}>{label}</Pill>
            {d !== null && d >= 0 && <Pill bg="rgba(0,0,0,0.32)" ink="#fff">D-{d}</Pill>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontDisplay, fontWeight: 600, color: T.ink, fontSize: 16 }}>{mono}</div>
            <span style={{ color: '#fff', fontFamily: T.fontUI, fontWeight: 600, fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{c.brands?.name}</span>
          </div>
        </div>
      </div>
      {/* 본문 */}
      <div style={{ padding: T.cardPad, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontFamily: T.fontUI, fontWeight: 700, fontSize: 17, color: T.ink, letterSpacing: '-0.02em' }}>{c.name}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 23, color: T.ink, letterSpacing: '-0.02em' }}>{reward ? `₩${won(reward)}` : (c.fee || '협의')}</span>
            {c.product_value ? <span style={{ fontFamily: T.fontUI, fontSize: 12.5, color: T.ink2, fontWeight: 500 }}>+ 제품 제공</span> : null}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, color: T.ink2, fontFamily: T.fontUI, fontSize: 12.5, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ico.camera width="15" height="15" />{c.content_type}</span>
            {(c.collab_required || c.second_use_required) && <span style={{ color: T.ink3 }}>·</span>}
            {c.collab_required && <span>공동작업</span>}
            {c.second_use_required && <span>2차활용</span>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onOpen() }} style={{ border: 'none', background: T.accent, color: T.accentInk, fontFamily: T.fontUI, fontWeight: 600, fontSize: 13.5, padding: '10px 18px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>지원하기</button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('전체')
  const [query, setQuery] = useState('')
  const [userName, setUserName] = useState('')
  const [apps, setApps] = useState<AppRow[]>([])
  const [showNoti, setShowNoti] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchCampaigns()
  }, [])

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) { router.replace('/login'); return }
    const uid = data.session.user.id
    const { data: inf } = await supabase.from('influencers').select('name, handle, status').eq('id', uid).single()
    if (inf && inf.status && inf.status !== 'approved') {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }
    if (inf) setUserName(inf.handle || inf.name)
    const { data: ar } = await supabase.from('applications').select('id, status, campaigns(name, upload_start, upload_end)').eq('influencer_id', uid).order('created_at', { ascending: false })
    setApps((ar as unknown as AppRow[]) || [])
  }

  const notis: Noti[] = apps.flatMap(a => {
    const name = a.campaigns?.name || '캠페인'
    if (a.status === 'in_progress') {
      const arr: Noti[] = [{ icon: '🎉', title: `${name} 선정!`, body: '캠페인에 선정되었어요. 신청 내역에서 확인하세요.', href: '/history' }]
      if (a.campaigns?.upload_end) arr.push({ icon: '📅', title: `${name} 업로드 일정`, body: `${a.campaigns.upload_start || ''} ~ ${a.campaigns.upload_end} · 스케줄에서 보기`, href: '/schedule' })
      return arr
    }
    if (a.status === 'not_done') return [{ icon: '🙏', title: `${name} 미선정`, body: '아쉽지만 이번엔 선정되지 않았어요.', href: '/history' }]
    if (a.status === 'pending' || a.status === 'scouted') return [{ icon: '⏳', title: `${name} 심사 중`, body: '신청이 검토되고 있어요.', href: '/history' }]
    return []
  })

  async function fetchCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*, brands(name)')
      .eq('recruitment_status', 'open')
      .eq('progress_status', 'in_progress')
      .order('created_at', { ascending: false })
    setCampaigns((data as Campaign[]) || [])
    setLoading(false)
  }

  const filtered = campaigns.filter(c => {
    const matchCat = catFilter === '전체' || (Array.isArray(c.category) ? c.category.includes(catFilter) : c.category === catFilter)
    const q = query.trim().toLowerCase()
    const matchQ = !q || c.name?.toLowerCase().includes(q) || c.brands?.name?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink }}>
      <div style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 120 }}>
        {/* 헤더 */}
        <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink3, letterSpacing: '0.02em', marginBottom: 6 }}>안녕하세요, {userName || '게스트'}님 ✦</div>
            <h1 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 30, lineHeight: 1.04, color: T.ink, letterSpacing: '-0.02em' }}>Campaigns</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <IconBtn icon={Ico.bell} badge={notis.length > 0} ariaLabel="알림" onClick={() => setShowNoti(true)} />
            <IconBtn icon={Ico.chat} ariaLabel="메시지" onClick={() => router.push('/messages')} />
          </div>
        </div>

        {/* 검색 */}
        <div style={{ padding: `14px ${T.pad}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: T.surface2, borderRadius: 999, color: T.ink3, border: `1px solid ${T.line}` }}>
            <Ico.search width="19" height="19" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="브랜드·캠페인 검색"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontFamily: T.fontUI, color: T.ink }} />
          </div>
        </div>

        {/* 카테고리 칩 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `14px ${T.pad}px`, scrollbarWidth: 'none' }}>
          {CATEGORY_FILTERS.map((c) => {
            const on = c === catFilter
            return (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '7px 13px', borderRadius: 999, whiteSpace: 'nowrap', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'pointer', background: on ? T.accent : T.surface2, color: on ? T.accentInk : T.ink2, border: on ? 'none' : `1px solid ${T.line}`, flexShrink: 0 }}>{c}</button>
            )
          })}
        </div>

        {/* 카드 리스트 */}
        <div style={{ padding: `0 ${T.pad}px`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <p style={{ color: T.ink3, fontSize: 14, padding: '40px 0', textAlign: 'center' }}>불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink3 }}>모집중인 캠페인이 없어요.</p>
            </div>
          ) : (
            filtered.map(c => <CampaignCard key={c.id} c={c} onOpen={() => router.push(`/campaign/${c.id}`)} />)
          )}
        </div>
      </div>

      {/* 알림 패널 */}
      {showNoti && (
        <div onClick={() => setShowNoti(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 200, display: 'flex', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ marginTop: 56, width: '100%', maxWidth: 480, background: T.surface, borderRadius: '0 0 24px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.line}`, position: 'sticky', top: 0, background: T.surface }}>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: T.fontUI, color: T.ink }}>알림</span>
              <button onClick={() => setShowNoti(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: T.ink3 }}>✕</button>
            </div>
            {notis.length === 0 ? (
              <p style={{ padding: '48px 20px', textAlign: 'center', fontSize: 14, color: T.ink3 }}>아직 알림이 없어요.</p>
            ) : notis.map((n, i) => (
              <div key={i} onClick={() => { setShowNoti(false); router.push(n.href) }}
                style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${T.line}`, cursor: 'pointer', alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: T.ink2, marginTop: 2, lineHeight: 1.5 }}>{n.body}</p>
                </div>
                <Ico.chevron width="18" height="18" style={{ color: T.ink3, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
