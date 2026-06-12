'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Ico, Pill, PhotoBlock, Monogram } from '@/components/ui'
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
  brands: { name: string }
  applications: { count: number }[]
}

interface AppRow { id: string; status: string; proposed_fee: number | null; campaign_id: string | null; campaigns: { name: string; upload_start: string; upload_end: string } | null }

const PREMIUM_MIN_FEE = 150000 // A등급 필터 기준: 이 금액 미만 캠페인은 A등급에게 숨김
interface Noti { icon: string; title: string; body: string; href: string }

// catKey 그룹 기준 필터 ('__liked' 는 관심 캠페인 전용 가상 키)
const CATEGORY_FILTERS: [string, string | null][] = [
  ['전체', null], ['♥ 찜', '__liked'], ['뷰티', 'beauty'], ['푸드', 'food'], ['패션', 'fashion'], ['라이프', 'life'], ['헬스', 'fitness'],
]

// 'YYYY-MM-DD' 를 로컬 자정 기준으로 D-day 계산
function dday(dateStr?: string): number | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
const applyDday = (c: Campaign) => {
  const v = dday(c.timeline_apply_end)
  return v !== null ? v : dday(c.upload_end)
}
const mono = (c: Campaign) => (c.brands?.name || '?').slice(0, 2).toUpperCase()
const reward = (c: Campaign) => c.fee_amount || c.product_value || 0
const label = (c: Campaign) => (CAT[catKey(c.category)] || CAT.default)[0]
const applyCount = (c: Campaign) => c.applications?.[0]?.count ?? 0

// 내 카테고리와의 적합도 — 카테고리 일치 시 높게, id 기반 결정적 가산
function matchScore(c: Campaign, myCats: string[]): number {
  const key = catKey(c.category)
  const mine = myCats.map(x => catKey(x))
  const base = mine.includes(key) ? 88 : 76
  let h = 0
  for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) % 997
  return Math.min(97, base + (h % 10))
}

// 둥근 아이콘 버튼 (레퍼런스의 원형 버튼)
function RoundBtn({ icon: I, onClick, ariaLabel, badge }: { icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement; onClick?: () => void; ariaLabel: string; badge?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel}
      style={{ width: 44, height: 44, borderRadius: 999, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <I width="21" height="21" />
      {badge && <span style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 999, background: T.blushInk, border: `2px solid ${T.surface}` }} />}
    </button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [myCats, setMyCats] = useState<string[]>([])
  const [apps, setApps] = useState<AppRow[]>([])
  const [showNoti, setShowNoti] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [myGrade, setMyGrade] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [liked, setLiked] = useState<Set<string>>(new Set())

  useEffect(() => {
    // 등급 계산과 캠페인 조회를 함께 끝낸 뒤 렌더 (A등급 필터 적용 전 깜빡임 제거)
    Promise.all([checkAuth(), fetchCampaigns()]).then(() => setLoading(false))
    // 관심 캠페인 복원
    try { setLiked(new Set(JSON.parse(localStorage.getItem('liked_campaigns') || '[]'))) } catch { /* 무시 */ }
  }, [])

  // 알림 패널 열림: 배경 스크롤 잠금 + Escape 닫기
  useEffect(() => {
    if (!showNoti) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNoti(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [showNoti])

  function toggleLike(id: string) {
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem('liked_campaigns', JSON.stringify([...next])) } catch { /* 무시 */ }
      return next
    })
  }

  async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) { router.replace('/login'); return }
    const uid = data.session.user.id
    const { data: inf } = await supabase.from('influencers')
      .select('name, handle, status, avatar_url, category, ig_feed_max, ig_reels_max, yt_shorts_max, yt_video_max')
      .eq('id', uid).single()
    if (inf && inf.status && inf.status !== 'approved') {
      await supabase.auth.signOut()
      router.replace('/login')
      return
    }
    if (inf) {
      setUserName(inf.name || inf.handle)
      setAvatarUrl(inf.avatar_url || '')
      setMyCats(Array.isArray(inf.category) ? inf.category : inf.category ? [inf.category] : [])
    }
    const { data: ar } = await supabase.from('applications')
      .select('id, status, proposed_fee, campaign_id, campaigns(name, upload_start, upload_end)')
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
      .select('*, brands(name), applications(count)')
      .eq('recruitment_status', 'open')
      .eq('progress_status', 'in_progress')
      .eq('app_hidden', false)
      .order('created_at', { ascending: false })
    if (error) { setLoadError(true); return }
    setCampaigns((data as Campaign[]) || [])
  }

  // A등급: fee_amount가 있고 PREMIUM_MIN_FEE 미만인 캠페인 숨김 (fee_amount 없으면 '협의' → 항상 노출)
  const gradeFiltered = myGrade === 'A'
    ? campaigns.filter(c => !c.fee_amount || c.fee_amount >= PREMIUM_MIN_FEE)
    : campaigns
  const filtered = gradeFiltered.filter(c => {
    if (catFilter === '__liked') return liked.has(c.id)
    return catFilter === null || catKey(c.category) === catFilter
  })

  // 내가 신청한 캠페인 / 진행 중 요약
  const appliedSet = new Set(apps.map(a => a.campaign_id).filter(Boolean) as string[])
  const inProgress = apps.filter(a => a.status === 'in_progress')
  const nearest = inProgress
    .filter(a => a.campaigns?.upload_end)
    .map(a => ({ name: a.campaigns!.name, d: dday(a.campaigns!.upload_end) }))
    .filter(x => x.d !== null)
    .sort((a, b) => (a.d as number) - (b.d as number))[0]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 인사 헤더 — 아바타 + 인사말 + 검색/알림 */}
        <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/my" aria-label="마이페이지" style={{ textDecoration: 'none', flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 46, height: 46, borderRadius: 16, objectFit: 'cover', border: `1px solid ${T.line}`, display: 'block' }} />
            ) : (
              <span style={{ width: 46, height: 46, borderRadius: 16, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700 }}>
                {(userName || '게').charAt(0)}
              </span>
            )}
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: T.ink3, fontWeight: 500 }}>안녕하세요,</p>
            <p style={{ margin: 0, fontSize: 17, color: T.ink, fontWeight: 800, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName ? `${userName}님` : '게스트님'}</p>
          </div>
          <RoundBtn icon={Ico.search} ariaLabel="캠페인 둘러보기" onClick={() => router.push('/campaigns')} />
          <RoundBtn icon={Ico.bell} ariaLabel="알림" badge={notis.length > 0} onClick={() => setShowNoti(true)} />
        </div>

        {/* 진행 중 캠페인 요약 — 할 일이 있는 사용자에게 최우선 노출 */}
        {!loading && inProgress.length > 0 && (
          <div style={{ padding: `0 ${T.pad}px` }}>
            <Link href="/schedule" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.sage, borderRadius: 20, padding: '14px 16px' }}>
                <span style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.55)', color: T.sageInk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico.calendar width="20" height="20" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: T.sageInk, letterSpacing: '-0.01em' }}>진행 중인 캠페인 {inProgress.length}개</span>
                  {nearest && (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.sageInk, opacity: 0.8, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nearest.name} · 업로드 {(nearest.d as number) < 0 ? '마감 지남' : (nearest.d as number) === 0 ? '오늘 마감' : `D-${nearest.d}`}
                    </span>
                  )}
                </span>
                <Ico.chevR width="17" height="17" style={{ color: T.sageInk, flexShrink: 0 }} />
              </div>
            </Link>
          </div>
        )}

        {/* 타이틀 + 카운트 */}
        <div style={{ padding: `4px ${T.pad}px 0`, display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: T.ink }}>캠페인</h1>
          {!loading && <span style={{ fontSize: 14, fontWeight: 600, color: T.ink3 }}>{filtered.length}</span>}
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `0 ${T.pad}px`, scrollbarWidth: 'none' }}>
          {CATEGORY_FILTERS.map(([l, key]) => {
            const on = catFilter === key
            return (
              <button key={l} type="button" onClick={() => setCatFilter(key)} aria-pressed={on}
                style={{ padding: '9px 16px', minHeight: 38, borderRadius: 999, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'pointer', background: on ? T.accent : T.surface, color: on ? T.accentInk : T.ink2, border: `1px solid ${on ? 'transparent' : T.line}`, flexShrink: 0 }}>
                {l}
              </button>
            )
          })}
        </div>

        {/* 캠페인 리스트 */}
        <div style={{ padding: `2px ${T.pad}px 0`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            /* 카드 치수에 맞는 스켈레톤 */
            [0, 1].map(i => (
              <div key={i} style={{ border: `1px solid ${T.line}`, borderRadius: 24, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="skel" style={{ width: 40, height: 40, borderRadius: 13 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel" style={{ height: 13, width: '40%', borderRadius: 6 }} />
                    <div className="skel" style={{ height: 11, width: '28%', borderRadius: 6, marginTop: 5 }} />
                  </div>
                </div>
                <div className="skel" style={{ height: 170, borderRadius: 16 }} />
                <div className="skel" style={{ height: 15, width: '65%', borderRadius: 6, marginTop: 12 }} />
                <div className="skel" style={{ height: 12, width: '50%', borderRadius: 6, marginTop: 8 }} />
              </div>
            ))
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink2, marginBottom: 14 }}>일시적인 오류가 발생했어요.</p>
              <button type="button" onClick={() => { setLoading(true); fetchCampaigns().then(() => setLoading(false)) }}
                style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '11px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                다시 시도
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink3 }}>
                {catFilter === '__liked' ? '아직 찜한 캠페인이 없어요.' : catFilter ? '해당 카테고리의 캠페인이 없어요.' : '모집중인 캠페인이 없어요.'}
              </p>
              {catFilter === '__liked' && (
                <p style={{ fontSize: 13, color: T.ink3, marginTop: 6 }}>마음에 드는 캠페인의 ♥ 를 눌러 모아보세요.</p>
              )}
            </div>
          ) : (
            filtered.map(c => {
              const d = applyDday(c)
              const isLiked = liked.has(c.id)
              return (
                <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 24, padding: 16, boxShadow: '0 1px 2px rgba(20,20,20,0.03)' }}>
                  {/* 카드 헤더: 브랜드 + 적합도 + 하트 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Monogram letter={mono(c)} cat={catKey(c.category)} size={40} radius={13} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.brands?.name}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: T.ink3, fontWeight: 600, marginTop: 1 }}>
                        <Ico.spark width="11" height="11" /> 추천 {matchScore(c, myCats)}%
                      </div>
                    </div>
                    <button type="button" onClick={() => toggleLike(c.id)}
                      aria-label={isLiked ? '관심 캠페인 해제' : '관심 캠페인 추가'} aria-pressed={isLiked}
                      style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? T.blushInk : T.ink3, flexShrink: 0 }}>
                      <svg width="21" height="21" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'}><path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7-2.7c0 4.9-7 9.7-7 9.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                    </button>
                  </div>

                  {/* 사진 + 본문 (탭하면 상세) */}
                  <Link href={`/campaign/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <PhotoBlock cat={catKey(c.category)} monogram={mono(c)} imageUrl={campaignImg(c.id, c.image_url)} radius={16} style={{ height: 172 }}>
                      <div style={{ position: 'absolute', inset: 0, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Pill bg="rgba(255,255,255,0.92)" ink={T.ink} size={10.5}>{label(c)}</Pill>
                        {appliedSet.has(c.id) && <Pill bg={T.sage} ink={T.sageInk} size={10.5}>✓ 신청함</Pill>}
                      </div>
                    </PhotoBlock>
                    <div style={{ padding: '12px 2px 0' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.name}</div>
                      {/* 메타: 리워드 · 마감(임박 시 강조) · 지원자 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, color: T.ink2, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4.5 }}>
                          <Ico.won width="13" height="13" /> {reward(c) ? `${won(reward(c))}원` : (c.fee || '협의')}
                        </span>
                        {d !== null && d >= 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4.5, color: d <= 3 ? T.danger : undefined, fontWeight: d <= 3 ? 700 : 600 }}>
                            <Ico.clock width="13" height="13" /> {d === 0 ? '오늘 마감' : `D-${d}`}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4.5 }}>
                          <Ico.user width="13" height="13" /> 지원 {applyCount(c)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })
          )}
        </div>
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
