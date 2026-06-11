'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Ico, Pill, IconBtn, PhotoBlock } from '@/components/ui'
import { T, CAT, catKey, won, campaignImg } from '@/lib/theme'

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
  timeline_apply_end: string
  collab_required: boolean
  second_use_required: boolean
  brands: { name: string }
}

interface AppRow { id: string; status: string; proposed_fee: number | null; campaigns: { name: string; upload_start: string; upload_end: string } | null }

const PREMIUM_MIN_FEE = 150000 // A등급 필터 기준: 이 금액 미만 캠페인은 A등급에게 숨김
interface Noti { icon: string; title: string; body: string; href: string }

// 'YYYY-MM-DD' 를 로컬 자정 기준으로 D-day 계산 (UTC 어긋남 제거)
function dday(dateStr?: string): number | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
// D-day 는 신청 마감 우선, 없으면 업로드 마감 폴백
const applyDday = (c: Campaign) => {
  const v = dday(c.timeline_apply_end)
  return v !== null ? { v, label: '신청' } : { v: dday(c.upload_end), label: '업로드' }
}
const mono = (c: Campaign) => (c.brands?.name || '?').charAt(0)
const reward = (c: Campaign) => c.fee_amount || c.product_value || 0
const label = (c: Campaign) => (CAT[catKey(c.category)] || CAT.default)[0]

export default function HomePage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [apps, setApps] = useState<AppRow[]>([])
  const [showNoti, setShowNoti] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [myGrade, setMyGrade] = useState('')

  useEffect(() => {
    // 등급 계산과 캠페인 조회를 함께 끝낸 뒤 렌더 (A등급 필터 적용 전 깜빡임 제거)
    Promise.all([checkAuth(), fetchCampaigns()]).then(() => setLoading(false))
  }, [])

  // 알림 패널 열림: 배경 스크롤 잠금 + Escape 닫기
  useEffect(() => {
    if (!showNoti) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNoti(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [showNoti])

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) { router.replace('/login'); return }
    const uid = data.session.user.id
    const { data: inf } = await supabase.from('influencers')
      .select('name, handle, status, ig_feed_max, ig_reels_max, yt_shorts_max, yt_video_max')
      .eq('id', uid).single()
    if (inf && inf.status && inf.status !== 'approved') {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }
    if (inf) setUserName(inf.handle || inf.name)
    const { data: ar } = await supabase.from('applications')
      .select('id, status, proposed_fee, campaigns(name, upload_start, upload_end)')
      .eq('influencer_id', uid).order('created_at', { ascending: false })
    const rows = (ar as unknown as AppRow[]) || []
    setApps(rows)
    // 등급 계산: 단가표 최대값 vs 실제 제안 고료 최대값 중 높은 쪽
    const i = inf as { ig_feed_max?: number; ig_reels_max?: number; yt_shorts_max?: number; yt_video_max?: number } | null
    const rateMax = Math.max(i?.ig_reels_max || 0, i?.ig_feed_max || 0, i?.yt_video_max || 0, i?.yt_shorts_max || 0) * 10000
    const propMax = rows.reduce((m, a) => Math.max(m, a.proposed_fee || 0), 0)
    const repFee = Math.max(rateMax, propMax)
    setMyGrade(repFee >= 300000 ? 'A' : repFee >= 150000 ? 'B' : repFee >= 50000 ? 'C' : '')
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
    setLoadError(false)
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, brands(name)')
      .eq('recruitment_status', 'open')
      .eq('progress_status', 'in_progress')
      .eq('app_hidden', false)
      .order('created_at', { ascending: false })
    if (error) { setLoadError(true); return }
    setCampaigns((data as Campaign[]) || [])
  }

  const open = (id: string) => router.push(`/campaign/${id}`)

  // A등급: fee_amount가 있고 PREMIUM_MIN_FEE 미만인 캠페인 숨김 (fee_amount 없으면 '협의' → 항상 노출)
  const filtered = myGrade === 'A'
    ? campaigns.filter(c => !c.fee_amount || c.fee_amount >= PREMIUM_MIN_FEE)
    : campaigns
  const hero = filtered[0]
  const rail = filtered.slice(1, 4)
  const list = filtered.slice(4)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 헤더 */}
        <div style={{ padding: `0 ${T.pad}px`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 로고 + 아이콘 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/siriai-logo.png?v=3" alt="SIRIAI" style={{ height: 26, width: 'auto', display: 'block' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <IconBtn icon={Ico.bell} badge={notis.length > 0} ariaLabel="알림" onClick={() => setShowNoti(true)} />
              <IconBtn icon={Ico.chat} ariaLabel="메시지" onClick={() => router.push('/messages')} />
            </div>
          </div>
          {/* 인사 + 태그라인 */}
          <div>
            <h1 style={{ margin: 0, fontFamily: T.fontUI, fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em', color: T.ink }}>{userName || '게스트'}님</h1>
            <p style={{ margin: '4px 0 0', fontFamily: T.fontUI, fontSize: 13, color: T.ink3 }}>사람과 브랜드를 잇는 특별한 연결</p>
          </div>
        </div>

        {loading ? (
          /* 레이아웃 치수에 맞는 스켈레톤 — 콘텐츠 점프 방지 */
          <>
            <div style={{ padding: `0 ${T.pad}px` }}><div className="skel" style={{ height: 360, borderRadius: T.radius }} /></div>
            <div style={{ display: 'flex', gap: 12, padding: `0 ${T.pad}px`, overflow: 'hidden' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 168, flexShrink: 0 }}>
                  <div className="skel" style={{ height: 130 }} />
                  <div className="skel" style={{ height: 14, width: '70%', marginTop: 10, borderRadius: 6 }} />
                  <div className="skel" style={{ height: 14, width: '45%', marginTop: 6, borderRadius: 6 }} />
                </div>
              ))}
            </div>
          </>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 15, color: T.ink2, marginBottom: 14 }}>일시적인 오류가 발생했어요.</p>
            <button type="button" onClick={() => { setLoading(true); fetchCampaigns().then(() => setLoading(false)) }}
              style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '11px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              다시 시도
            </button>
          </div>
        ) : !hero ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 15, color: T.ink3 }}>모집중인 캠페인이 없어요.</p>
          </div>
        ) : (
          <>
            {/* 히어로 */}
            <div style={{ padding: `0 ${T.pad}px` }}>
              <Link href={`/campaign/${hero.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <PhotoBlock cat={catKey(hero.category)} imageUrl={campaignImg(hero.id, hero.image_url)} radius={T.radius} style={{ height: 360, cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', inset: 0, padding: T.cardPad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Pill bg="rgba(255,255,255,0.92)" ink={T.ink}>✦ 이주의 추천</Pill>
                      {(() => { const d = applyDday(hero); return d.v !== null && d.v >= 0 && <Pill bg="rgba(0,0,0,0.32)" ink="#fff">{d.label} D-{d.v}</Pill> })()}
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.85)', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{hero.brands?.name} · {label(hero)}</div>
                      <h2 style={{ margin: 0, fontFamily: T.fontUI, fontWeight: 700, fontSize: 26, lineHeight: 1.25, color: '#fff', letterSpacing: '-0.02em' }}>{hero.name}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontFamily: T.fontUI, marginBottom: 2 }}>리워드</div>
                          <div style={{ color: '#fff', fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em' }}>{reward(hero) ? `₩${won(reward(hero))}` : (hero.fee || '협의')}</div>
                        </div>
                        {/* 카드 전체가 링크이므로 버튼 대신 시각적 라벨 */}
                        <span style={{ background: '#fff', color: T.accent, fontFamily: T.fontUI, fontWeight: 700, fontSize: 14, padding: '13px 22px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>자세히 <Ico.chevR width="15" height="15" /></span>
                      </div>
                    </div>
                  </div>
                </PhotoBlock>
              </Link>
            </div>

            {/* 가로 레일 */}
            {rail.length > 0 && (
              <div>
                <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 19, color: T.ink, letterSpacing: '-0.02em' }}>For You</h3>
                  <Link href="/campaigns" style={{ fontFamily: T.fontUI, fontSize: 12.5, color: T.ink3, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none', padding: '12px 0 12px 12px' }}>전체보기 <Ico.chevR width="13" height="13" /></Link>
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: `0 ${T.pad}px`, scrollbarWidth: 'none' }}>
                  {rail.map((c) => (
                    <Link key={c.id} href={`/campaign/${c.id}`} style={{ width: 168, flexShrink: 0, cursor: 'pointer', textDecoration: 'none' }}>
                      <PhotoBlock cat={catKey(c.category)} monogram={mono(c)} imageUrl={campaignImg(c.id, c.image_url)} style={{ height: 130 }}>
                        <div style={{ position: 'absolute', top: 10, left: 10 }}><Pill bg="rgba(255,255,255,0.92)" ink={T.ink} size={10.5}>{label(c)}</Pill></div>
                      </PhotoBlock>
                      <div style={{ padding: '10px 2px 0' }}>
                        <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>{c.brands?.name}</div>
                        <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', margin: '2px 0 6px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.name}</div>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 16, color: T.ink }}>{reward(c) ? `₩${won(reward(c))}` : (c.fee || '협의')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 컴팩트 슬라이드 */}
            {list.length > 0 && (
              <div>
                <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 19, color: T.ink, letterSpacing: '-0.02em' }}>Just In</h3>
                  <Link href="/campaigns" style={{ fontFamily: T.fontUI, fontSize: 12.5, color: T.ink3, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none', padding: '12px 0 12px 12px' }}>전체보기 <Ico.chevR width="13" height="13" /></Link>
                </div>
                <div style={{ display: 'flex', gap: 13, overflowX: 'auto', padding: `0 ${T.pad}px`, scrollbarWidth: 'none' }}>
                  {list.map((c) => (
                    <Link key={c.id} href={`/campaign/${c.id}`} style={{ width: 268, flexShrink: 0, cursor: 'pointer', textDecoration: 'none' }}>
                      <PhotoBlock cat={catKey(c.category)} monogram={mono(c)} imageUrl={campaignImg(c.id, c.image_url)} radius={T.radiusSm} style={{ height: 150 }}>
                        <div style={{ position: 'absolute', inset: 0, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Pill bg="rgba(255,255,255,0.92)" ink={T.ink} size={10.5}>{label(c)}</Pill>
                          {(() => { const d = applyDday(c); return d.v !== null && d.v >= 0 && <Pill bg="rgba(0,0,0,0.32)" ink="#fff" size={10.5}>{d.label} D-{d.v}</Pill> })()}
                        </div>
                      </PhotoBlock>
                      <div style={{ padding: '10px 2px 0' }}>
                        <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>{c.brands?.name}</div>
                        <div style={{ fontFamily: T.fontUI, fontSize: 14.5, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', margin: '2px 0 6px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{c.name}</div>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 16, color: T.ink }}>{reward(c) ? `₩${won(reward(c))}` : (c.fee || '협의')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 알림 패널 */}
      {showNoti && (
        <div onClick={() => setShowNoti(false)} role="dialog" aria-modal="true" aria-label="알림"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 200, display: 'flex', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ marginTop: 56, width: '100%', maxWidth: 480, background: T.surface, borderRadius: '0 0 24px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ padding: '10px 12px 10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.line}`, position: 'sticky', top: 0, background: T.surface }}>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: T.fontUI, color: T.ink }}>알림</span>
              <button type="button" onClick={() => setShowNoti(false)} aria-label="알림 닫기"
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', fontSize: 17, cursor: 'pointer', color: T.ink3 }}>✕</button>
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
                <Ico.chevR width="18" height="18" style={{ color: T.ink3, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
