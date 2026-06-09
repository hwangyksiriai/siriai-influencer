'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Ico, Pill, PhotoBlock } from '@/components/ui'
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
  brands: { name: string }
}

const CATEGORY_FILTERS = ['전체', '색조', '스킨케어', '패션', '라이프', '육아', '피트니스']

function dday(dateStr?: string): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
const mono = (c: Campaign) => (c.brands?.name || '?').charAt(0)
const reward = (c: Campaign) => c.fee_amount || c.product_value || 0
const label = (c: Campaign) => (CAT[catKey(c.category)] || CAT.default)[0]

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('전체')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const { data: rows } = await supabase
        .from('campaigns')
        .select('*, brands(name)')
        .eq('recruitment_status', 'open')
        .eq('progress_status', 'in_progress')
        .eq('app_hidden', false)
        .order('created_at', { ascending: false })
      setCampaigns((rows as Campaign[]) || [])
      setLoading(false)
    })
  }, [])

  const filtered = campaigns.filter(c => catFilter === '전체' || (Array.isArray(c.category) ? c.category.includes(catFilter) : c.category === catFilter))

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 120 }}>
        {/* 헤더 */}
        <div style={{ position: 'sticky', top: 0, background: T.bg, zIndex: 10, paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <div style={{ padding: `0 ${T.pad}px 12px`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} aria-label="뒤로" style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico.back width="20" height="20" />
            </button>
            <h1 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 26, letterSpacing: '-0.02em', color: T.ink }}>All Campaigns</h1>
          </div>
          {/* 카테고리 필터 */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: `0 ${T.pad}px 14px`, scrollbarWidth: 'none' }}>
            {CATEGORY_FILTERS.map(c => {
              const on = c === catFilter
              return (
                <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '7px 13px', borderRadius: 999, whiteSpace: 'nowrap', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'pointer', background: on ? T.accent : T.surface2, color: on ? T.accentInk : T.ink2, border: on ? 'none' : `1px solid ${T.line}`, flexShrink: 0 }}>{c}</button>
              )
            })}
          </div>
        </div>

        {/* 그리드 */}
        <div style={{ padding: `4px ${T.pad}px 0` }}>
          {loading ? (
            <p style={{ color: T.ink3, fontSize: 14, padding: '40px 0', textAlign: 'center' }}>불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink3 }}>해당 카테고리의 캠페인이 없어요.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => router.push(`/campaign/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <PhotoBlock cat={catKey(c.category)} monogram={mono(c)} imageUrl={campaignImg(c.id, c.image_url)} radius={T.radiusSm} style={{ aspectRatio: '3/4' }}>
                    <div style={{ position: 'absolute', inset: 0, padding: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Pill bg="rgba(255,255,255,0.92)" ink={T.ink} size={10.5}>{label(c)}</Pill>
                      {dday(c.upload_end) !== null && dday(c.upload_end)! >= 0 && <Pill bg="rgba(0,0,0,0.32)" ink="#fff" size={10.5}>D-{dday(c.upload_end)}</Pill>}
                    </div>
                  </PhotoBlock>
                  <div style={{ padding: '10px 2px 0' }}>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>{c.brands?.name}</div>
                    <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', margin: '2px 0 6px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.name}</div>
                    <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 16, color: T.ink }}>{reward(c) ? `₩${won(reward(c))}` : (c.fee || '협의')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
