'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

interface Campaign {
  id: string
  name: string
  fee: string
  fee_amount: number
  product_value: number
  image_url: string
  category: string
  content_type: string
  upload_start: string
  upload_end: string
  collab_required: boolean
  second_use_required: boolean
  brands: { name: string }
}

interface AppRow { id: string; status: string; campaigns: { name: string; upload_start: string; upload_end: string } | null }
interface Noti { icon: string; title: string; body: string; href: string }

const CATEGORY_FILTERS = ['전체', '뷰티', '패션', '라이프']
const TYPE_FILTERS = ['전체', '릴스', '피드']
const chip = (active: boolean): React.CSSProperties => ({
  borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
  border: '1.5px solid', transition: 'all .15s', cursor: 'pointer',
  borderColor: active ? '#211A33' : 'rgba(33,26,51,.2)',
  background: active ? '#211A33' : 'transparent',
  color: active ? '#F3EEE2' : 'rgba(33,26,51,.6)',
})

export default function HomePage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('전체')
  const [typeFilter, setTypeFilter] = useState('전체')
  const [showFilter, setShowFilter] = useState(false)
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
    const matchCat = catFilter === '전체' || c.category === catFilter
    const matchType = typeFilter === '전체' || c.content_type?.includes(typeFilter)
    return matchCat && matchType
  })

  const activeCount = (catFilter !== '전체' ? 1 : 0) + (typeFilter !== '전체' ? 1 : 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 80 }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 20px 0', background: '#F3EEE2', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(33,26,51,.08)' }}>
        {/* 로고 + 인사(오른쪽 같은 선상) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <img src="/siriai-logo.png?v=3" alt="SIRIAI" style={{ height: 30, width: 'auto', display: 'block' }} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', color: '#211A33' }}>{userName}님</p>
            <p style={{ fontSize: 11, color: 'rgba(33,26,51,.5)', marginTop: 2 }}>사람과 브랜드를 잇는 특별한 연결</p>
          </div>
        </div>

        {/* 종 (단독, 오른쪽) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
          <button onClick={() => setShowNoti(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, position: 'relative' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#211A33" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {notis.length > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: '#e65100', color: '#fff', borderRadius: 100, fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{notis.length}</span>}
          </button>
        </div>

        {/* 캠페인 제목 + 필터 (종 아래) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>캠페인</h1>
          <button onClick={() => setShowFilter(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: (showFilter || activeCount) ? '#211A33' : 'rgba(33,26,51,.06)', color: (showFilter || activeCount) ? '#F3EEE2' : '#211A33', border: 'none', borderRadius: 100, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            필터{activeCount > 0 ? ` ${activeCount}` : ''}
          </button>
        </div>

        {/* 필터 패널 (아이콘 클릭 시) */}
        {showFilter && (
          <div style={{ paddingBottom: 12 }}>
            <p style={{ fontSize: 11, color: 'rgba(33,26,51,.45)', fontWeight: 600, marginBottom: 6 }}>카테고리</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 10 }}>
              {CATEGORY_FILTERS.map(f => (
                <button key={f} onClick={() => setCatFilter(f)} style={chip(catFilter === f)}>{f}</button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(33,26,51,.45)', fontWeight: 600, marginBottom: 6 }}>콘텐츠 타입</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {TYPE_FILTERS.map(f => (
                <button key={f} onClick={() => setTypeFilter(f)} style={chip(typeFilter === f)}>{f}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 캠페인 목록 */}
      <main style={{ padding: '12px 20px' }}>
        {loading ? (
          <p style={{ color: 'rgba(33,26,51,.4)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 15, color: 'rgba(33,26,51,.5)' }}>모집중인 캠페인이 없어요.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {filtered.map(c => (
              <Link key={c.id} href={`/campaign/${c.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}>
                  {/* 썸네일 */}
                  <div style={{ width: '100%', aspectRatio: '3/4', background: 'linear-gradient(135deg, #f0ece2, #e8e4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {c.image_url && <img src={c.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <span style={{ fontFamily: "'Helvetica Neue',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: 'rgba(33,26,51,.4)', textTransform: 'uppercase' }}>{c.brands?.name}</span>
                    {c.upload_end && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(33,26,51,.7)', color: '#F3EEE2', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 99 }}>
                        {c.content_type}
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                      {c.collab_required && <div style={{ background: '#2A6FDB', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>공동작업</div>}
                      {c.second_use_required && <div style={{ background: '#e65100', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>2차활용</div>}
                    </div>
                  </div>
                  {/* 정보 */}
                  <div style={{ padding: '8px 10px 12px' }}>
                    <p style={{ fontSize: 10, color: 'rgba(33,26,51,.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 2 }}>{c.brands?.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#211A33', lineHeight: 1.3, marginBottom: 3 }}>{c.name}</p>
                    {c.product_value ? <p style={{ fontSize: 11, color: 'rgba(33,26,51,.55)', marginBottom: 2 }}>🎁 {c.product_value.toLocaleString()}원 상당</p> : null}
                    {(c.fee_amount || c.fee) && <p style={{ fontSize: 12, fontWeight: 800, color: '#e65100' }}>💵 {c.fee_amount ? `${c.fee_amount.toLocaleString()}원` : c.fee}</p>}
                    <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(33,26,51,.07)', padding: '2px 7px', borderRadius: 4, fontSize: 10, color: 'rgba(33,26,51,.6)' }}>{c.content_type}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* 알림 패널 */}
      {showNoti && (
        <div onClick={() => setShowNoti(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 200, display: 'flex', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ marginTop: 56, width: '100%', maxWidth: 430, background: '#fff', borderRadius: '0 0 18px 18px', maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(33,26,51,.08)', position: 'sticky', top: 0, background: '#fff' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#211A33' }}>알림</span>
              <button onClick={() => setShowNoti(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'rgba(33,26,51,.5)' }}>✕</button>
            </div>
            {notis.length === 0 ? (
              <p style={{ padding: '48px 20px', textAlign: 'center', fontSize: 14, color: 'rgba(33,26,51,.5)' }}>아직 알림이 없어요.</p>
            ) : notis.map((n, i) => (
              <div key={i} onClick={() => { setShowNoti(false); router.push(n.href) }}
                style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(33,26,51,.05)', cursor: 'pointer', alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#211A33' }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(33,26,51,.55)', marginTop: 2, lineHeight: 1.5 }}>{n.body}</p>
                </div>
                <span style={{ color: 'rgba(33,26,51,.3)', fontSize: 18, flexShrink: 0 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
