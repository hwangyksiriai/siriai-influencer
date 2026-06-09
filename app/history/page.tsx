'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T, catKey } from '@/lib/theme'
import { Ico, Pill, Card, Chip, Monogram, IconBtn, AppHeader } from '@/components/ui'

interface Application {
  id: string
  status: string
  created_at: string
  campaigns: { id: string; name: string; content_type: string; category: string | null; brands: { name: string } }
  submissions: { id: string }[]
}

// 링크 업로드 완료 여부: in_progress이고 submission이 1건 이상이면 '완료'
function dispStatus(a: Application): string {
  if (a.status === 'in_progress' && a.submissions?.length > 0) return 'done'
  return a.status
}

const TABS = ['전체', '섭외', '대기', '진행', '완료', '미진행']
const statusLabel: Record<string, string> = { scouted: '섭외', pending: '대기', in_progress: '진행', not_done: '미진행', done: '완료' }
const statusInk: Record<string, string> = { scouted: T.lavInk, pending: T.butterInk, in_progress: T.sageInk, not_done: T.blushInk, done: '#1A5E36' }
const statusBg: Record<string, string> = { scouted: T.lav, pending: T.butter, in_progress: T.sage, not_done: T.blush, done: '#C4EDD5' }

export default function HistoryPage() {
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('전체')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const { data: applications } = await supabase
        .from('applications')
        .select('*, campaigns(id, name, content_type, category, brands(name)), submissions(id)')
        .eq('influencer_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setApps((applications as Application[]) || [])
      setLoading(false)
    })
  }, [])

  const tabMap: Record<string, string> = { '섭외': 'scouted', '대기': 'pending', '진행': 'in_progress', '완료': 'done', '미진행': 'not_done' }
  const filtered = tab === '전체' ? apps : apps.filter(a => dispStatus(a) === tabMap[tab])

  const countBy = (s: string) => apps.filter(a => dispStatus(a) === s).length

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AppHeader kicker="신청 내역" title="My Activity" right={<IconBtn icon={Ico.filter} />} />

        {/* 요약 카드 */}
        <div style={{ padding: `4px ${T.pad}px 0` }}>
          <Card style={{ background: T.accent, border: 'none' }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em' }}>MY CAMPAIGNS</div>
            <div style={{ color: T.accentInk, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 34, letterSpacing: '-0.02em', margin: '6px 0 16px', lineHeight: 1 }}>{apps.length}건</div>
            <div style={{ display: 'flex', gap: 22 }}>
              {[['완료', countBy('done')], ['진행', countBy('in_progress')], ['대기', countBy('pending')], ['미진행', countBy('not_done')]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 15, fontWeight: 700 }}>{v}건</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: T.fontUI, fontSize: 11.5, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 필터 */}
        <div style={{ display: 'flex', gap: 8, padding: `0 ${T.pad}px`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}
        </div>

        {/* 리스트 */}
        <div style={{ padding: `0 ${T.pad}px` }}>
          {loading ? (
            <p style={{ color: T.ink3, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: T.ink2 }}>내역이 없어요.</p>
            </div>
          ) : (
            <Card pad={false}>
              {filtered.map((a, i) => (
                <Link key={a.id} href={`/campaign/${a.campaigns?.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: T.cardPad, borderBottom: i < filtered.length - 1 ? `1px solid ${T.line}` : 'none', cursor: 'pointer' }}>
                    <Monogram letter={a.campaigns?.brands?.name?.charAt(0) || '·'} cat={catKey(a.campaigns?.category)} size={46} radius={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.fontUI, fontSize: 14.5, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.campaigns?.name}</div>
                      <div style={{ fontFamily: T.fontUI, fontSize: 12, color: T.ink3, marginTop: 2 }}>{a.campaigns?.brands?.name} · {a.campaigns?.content_type}</div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <Pill bg={statusBg[dispStatus(a)] || T.surface2} ink={statusInk[dispStatus(a)] || T.ink2} size={10.5}>{statusLabel[dispStatus(a)] || a.status}</Pill>
                    </div>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
