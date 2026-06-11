'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Ico, Pill, Chip, PhotoBlock } from '@/components/ui'
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
  upload_end: string
  timeline_apply_end: string
  brands: { name: string }
}

// catKey 그룹 기준 필터 — DB의 다양한 한글 카테고리(색조/스킨케어/푸드/카페 등)를 그룹으로 묶어 거름
const CATEGORY_FILTERS: [string, string | null][] = [
  ['전체', null], ['뷰티', 'beauty'], ['푸드', 'food'], ['패션', 'fashion'], ['라이프', 'life'], ['헬스', 'fitness'],
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
// D-day 는 신청 마감 우선, 없으면 업로드 마감 폴백
const applyDday = (c: Campaign) => {
  const v = dday(c.timeline_apply_end)
  return v !== null ? { v, label: '신청' } : { v: dday(c.upload_end), label: '업로드' }
}
const mono = (c: Campaign) => (c.brands?.name || '?').charAt(0)
const reward = (c: Campaign) => c.fee_amount || c.product_value || 0
const label = (c: Campaign) => (CAT[catKey(c.category)] || CAT.default)[0]

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [catFilter, setCatFilter] = useState<string | null>(null)

  async function load() {
    setLoadError(false)
    const { data: rows, error } = await supabase
      .from('campaigns')
      .select('*, brands(name)')
      .eq('recruitment_status', 'open')
      .eq('progress_status', 'in_progress')
      .eq('app_hidden', false)
      .order('created_at', { ascending: false })
    if (error) { setLoadError(true); setLoading(false); return }
    setCampaigns((rows as Campaign[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      load()
    })
  }, [])

  const filtered = campaigns.filter(c => catFilter === null || catKey(c.category) === catFilter)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 120 }}>
        {/* 헤더 */}
        <div style={{ position: 'sticky', top: 0, background: T.bg, zIndex: 10, paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ padding: `0 ${T.pad}px 12px`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => router.back()} aria-label="뒤로가기" style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico.back width="20" height="20" />
            </button>
            <h1 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 26, letterSpacing: '-0.02em', color: T.ink }}>All Campaigns</h1>
          </div>
          {/* 카테고리 필터 */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `0 ${T.pad}px 14px`, scrollbarWidth: 'none' }}>
            {CATEGORY_FILTERS.map(([l, key]) => (
              <Chip key={l} active={catFilter === key} onClick={() => setCatFilter(key)}>{l}</Chip>
            ))}
          </div>
        </div>

        {/* 그리드 */}
        <div style={{ padding: `4px ${T.pad}px 0` }}>
          {loading ? (
            /* 그리드 치수에 맞는 스켈레톤 */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i}>
                  <div className="skel" style={{ aspectRatio: '3/4' }} />
                  <div className="skel" style={{ height: 13, width: '60%', marginTop: 10, borderRadius: 6 }} />
                  <div className="skel" style={{ height: 13, width: '40%', marginTop: 6, borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink2, marginBottom: 14 }}>일시적인 오류가 발생했어요.</p>
              <button type="button" onClick={() => { setLoading(true); load() }}
                style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '11px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                다시 시도
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink3 }}>해당 카테고리의 캠페인이 없어요.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {filtered.map(c => (
                <Link key={c.id} href={`/campaign/${c.id}`} style={{ cursor: 'pointer', textDecoration: 'none' }}>
                  <PhotoBlock cat={catKey(c.category)} monogram={mono(c)} imageUrl={campaignImg(c.id, c.image_url)} radius={T.radiusSm} style={{ aspectRatio: '3/4' }}>
                    <div style={{ position: 'absolute', inset: 0, padding: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Pill bg="rgba(255,255,255,0.92)" ink={T.ink} size={10.5}>{label(c)}</Pill>
                      {(() => { const d = applyDday(c); return d.v !== null && d.v >= 0 && <Pill bg="rgba(0,0,0,0.32)" ink="#fff" size={10.5}>{d.label} D-{d.v}</Pill> })()}
                    </div>
                  </PhotoBlock>
                  <div style={{ padding: '10px 2px 0' }}>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>{c.brands?.name}</div>
                    <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', margin: '2px 0 6px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.name}</div>
                    <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 16, color: T.ink }}>{reward(c) ? `₩${won(reward(c))}` : (c.fee || '협의')}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
