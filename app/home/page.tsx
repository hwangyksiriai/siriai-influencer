'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Ico, Pill, Card, Monogram, IconBtn, PhotoBlock } from '@/components/ui'
import { T, CAT, catKey, won } from '@/lib/theme'

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

function dday(dateStr?: string): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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

  const open = (id: string) => router.push(`/campaign/${id}`)

  const hero = campaigns[0]
  const rail = campaigns.slice(1, 4)
  const list = campaigns.slice(4)
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 헤더 */}
        <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, color: T.ink3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>SIRIAI · CURATED · {today}</div>
            <h1 style={{ margin: '4px 0 0', fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 30, letterSpacing: '-0.02em', color: T.ink }}>Curation</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <IconBtn icon={Ico.bell} badge={notis.length > 0} ariaLabel="알림" onClick={() => setShowNoti(true)} />
            <IconBtn icon={Ico.chat} ariaLabel="메시지" onClick={() => router.push('/messages')} />
          </div>
        </div>

        {loading ? (
          <p style={{ color: T.ink3, fontSize: 14, padding: '40px 0', textAlign: 'center' }}>불러오는 중...</p>
        ) : !hero ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 15, color: T.ink3 }}>모집중인 캠페인이 없어요.</p>
          </div>
        ) : (
          <>
            {/* 히어로 */}
            <div style={{ padding: `0 ${T.pad}px` }}>
              <PhotoBlock cat={catKey(hero.category)} imageUrl={hero.image_url || undefined} radius={T.radius} style={{ height: 360, cursor: 'pointer' }}>
                <div style={{ position: 'absolute', inset: 0, padding: T.cardPad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => open(hero.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Pill bg="rgba(255,255,255,0.92)" ink={T.ink}>✦ 이주의 추천</Pill>
                    {dday(hero.upload_end) !== null && dday(hero.upload_end)! >= 0 && <Pill bg="rgba(0,0,0,0.32)" ink="#fff">D-{dday(hero.upload_end)}</Pill>}
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{hero.brands?.name} · {label(hero)}</div>
                    <h2 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 34, lineHeight: 1.06, color: '#fff', letterSpacing: '-0.02em' }}>{hero.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                      <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontFamily: T.fontUI, marginBottom: 2 }}>리워드</div>
                        <div style={{ color: '#fff', fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em' }}>{reward(hero) ? `₩${won(reward(hero))}` : (hero.fee || '협의')}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); open(hero.id) }} style={{ border: 'none', background: '#fff', color: '#1a1916', fontFamily: T.fontUI, fontWeight: 700, fontSize: 14, padding: '13px 22px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>자세히 <Ico.chevR width="15" height="15" /></button>
                    </div>
                  </div>
                </div>
              </PhotoBlock>
            </div>

            {/* 가로 레일 */}
            {rail.length > 0 && (
              <div>
                <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 19, color: T.ink, letterSpacing: '-0.02em' }}>For You</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: `0 ${T.pad}px`, scrollbarWidth: 'none' }}>
                  {rail.map((c) => (
                    <div key={c.id} onClick={() => open(c.id)} style={{ width: 168, flexShrink: 0, cursor: 'pointer' }}>
                      <PhotoBlock cat={catKey(c.category)} monogram={mono(c)} imageUrl={c.image_url || undefined} style={{ height: 130 }}>
                        <div style={{ position: 'absolute', top: 10, left: 10 }}><Pill bg="rgba(255,255,255,0.92)" ink={T.ink} size={10.5}>{label(c)}</Pill></div>
                      </PhotoBlock>
                      <div style={{ padding: '10px 2px 0' }}>
                        <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>{c.brands?.name}</div>
                        <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', margin: '2px 0 6px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.name}</div>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 16, color: T.ink }}>{reward(c) ? `₩${won(reward(c))}` : (c.fee || '협의')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 컴팩트 리스트 */}
            {list.length > 0 && (
              <div style={{ padding: `0 ${T.pad}px` }}>
                <h3 style={{ margin: '0 0 12px', fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 19, color: T.ink, letterSpacing: '-0.02em' }}>Just In</h3>
                <Card pad={false}>
                  {list.map((c, i, arr) => (
                    <div key={c.id} onClick={() => open(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: T.cardPad, borderBottom: i < arr.length - 1 ? `1px solid ${T.line}` : 'none', cursor: 'pointer' }}>
                      <Monogram letter={mono(c)} cat={catKey(c.category)} size={46} radius={14} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>{c.brands?.name}</div>
                        <div style={{ fontFamily: T.fontUI, fontSize: 14.5, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 15, color: T.ink }}>{reward(c) ? `₩${won(reward(c))}` : (c.fee || '협의')}</div>
                        {dday(c.upload_end) !== null && dday(c.upload_end)! >= 0 && <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.ink3 }}>D-{dday(c.upload_end)}</div>}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </>
        )}
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
