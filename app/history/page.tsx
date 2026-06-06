'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

interface Application {
  id: string
  status: string
  created_at: string
  campaigns: { id: string; name: string; content_type: string; brands: { name: string } }
}

const TABS = ['전체', '섭외', '대기', '진행', '미진행']
const statusLabel: Record<string, string> = { scouted: '섭외', pending: '대기', in_progress: '진행', not_done: '미진행' }
const statusColor: Record<string, string> = { scouted: '#2A6FDB', pending: '#e65100', in_progress: '#2e7d32', not_done: '#c62828' }
const statusBg: Record<string, string> = { scouted: 'rgba(42,111,219,.1)', pending: 'rgba(230,81,0,.1)', in_progress: 'rgba(46,125,50,.1)', not_done: 'rgba(198,40,40,.1)' }

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
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 80 }}>
      <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, background: '#F3EEE2', zIndex: 10, borderBottom: '1px solid rgba(33,26,51,.08)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33', marginBottom: 14 }}>내역</h1>
        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, paddingLeft: 20 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #211A33' : '2px solid transparent', padding: '8px 14px', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#211A33' : 'rgba(33,26,51,.4)', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding: '12px 0' }}>
        {loading ? (
          <p style={{ color: 'rgba(33,26,51,.4)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 15, color: 'rgba(33,26,51,.5)' }}>내역이 없어요.</p>
          </div>
        ) : (
          filtered.map(a => (
            <Link key={a.id} href={`/campaign/${a.campaigns?.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(33,26,51,.06)', alignItems: 'flex-start' }}>
                <div style={{ width: 64, height: 64, borderRadius: 10, background: 'rgba(33,26,51,.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'rgba(33,26,51,.3)', letterSpacing: '.06em' }}>{a.campaigns?.content_type?.slice(0, 2)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, color: 'rgba(33,26,51,.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 2 }}>{a.campaigns?.brands?.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#211A33', marginBottom: 4, lineHeight: 1.3 }}>{a.campaigns?.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(33,26,51,.5)' }}>{a.campaigns?.content_type}</p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-block', background: statusBg[a.status], color: statusColor[a.status], fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>
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
