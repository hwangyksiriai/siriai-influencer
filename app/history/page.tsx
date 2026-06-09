'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T } from '@/lib/theme'

interface Application {
  id: string
  status: string
  created_at: string
  campaigns: { id: string; name: string; content_type: string; brands: { name: string } }
}

const TABS = ['전체', '섭외', '대기', '진행', '미진행']
const statusLabel: Record<string, string> = { scouted: '섭외', pending: '대기', in_progress: '진행', not_done: '미진행' }
const statusColor: Record<string, string> = { scouted: T.lavInk, pending: T.butterInk, in_progress: T.sageInk, not_done: T.blushInk }
const statusBg: Record<string, string> = { scouted: T.lav, pending: T.butter, in_progress: T.sage, not_done: T.blush }

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
        .select('*, campaigns(id, name, content_type, brands(name))')
        .eq('influencer_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setApps((applications as Application[]) || [])
      setLoading(false)
    })
  }, [])

  const tabMap: Record<string, string> = { '섭외': 'scouted', '대기': 'pending', '진행': 'in_progress', '미진행': 'not_done' }
  const filtered = tab === '전체' ? apps : apps.filter(a => a.status === tabMap[tab])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
      <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, background: T.bg, zIndex: 10, borderBottom: `1px solid ${T.line}` }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, marginBottom: 14 }}>내역</h1>
        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, paddingLeft: 20 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${T.accent}` : '2px solid transparent', padding: '8px 14px', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? T.ink : T.ink3, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding: '12px 0' }}>
        {loading ? (
          <p style={{ color: T.ink3, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 15, color: T.ink2 }}>내역이 없어요.</p>
          </div>
        ) : (
          filtered.map(a => (
            <Link key={a.id} href={`/campaign/${a.campaigns?.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${T.line}`, alignItems: 'flex-start' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: T.surface2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, color: T.ink3, letterSpacing: '.06em' }}>{a.campaigns?.content_type?.slice(0, 2)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, color: T.ink3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 2 }}>{a.campaigns?.brands?.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4, lineHeight: 1.3 }}>{a.campaigns?.name}</p>
                  <p style={{ fontSize: 11, color: T.ink2 }}>{a.campaigns?.content_type}</p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-block', background: statusBg[a.status], color: statusColor[a.status], fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
                    {statusLabel[a.status] || a.status}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
