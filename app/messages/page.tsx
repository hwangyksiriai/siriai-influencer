'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

interface Msg { id: string; campaign_id: string; sender: string; body: string; created_at: string; campaigns: { name: string; brands: { name: string } | null } | null }
interface Thread { cid: string; camp: string; brand: string; last: string; lastAt: string; lastSender: string }

export default function InfMessagesPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const uid = data.session.user.id
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, campaign_id, sender, body, created_at, campaigns(name, brands(name))')
        .eq('influencer_id', uid)
        .order('created_at', { ascending: false })
      const map = new Map<string, Thread>()
      for (const m of (msgs as unknown as Msg[]) || []) {
        if (!map.has(m.campaign_id)) map.set(m.campaign_id, { cid: m.campaign_id, camp: m.campaigns?.name || '캠페인', brand: m.campaigns?.brands?.name || '', last: m.body, lastAt: m.created_at, lastSender: m.sender })
      }
      setThreads(Array.from(map.values()))
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 80 }}>
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(33,26,51,.08)', position: 'sticky', top: 0, background: '#F3EEE2', zIndex: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>메시지</h1>
        <p style={{ fontSize: 12, color: 'rgba(33,26,51,.5)', marginTop: 2 }}>담당자와 1:1로 대화해요</p>
      </div>

      <main style={{ padding: '14px 20px' }}>
        {loading ? (
          <p style={{ color: 'rgba(33,26,51,.4)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>💬</p>
            <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)', lineHeight: 1.6 }}>아직 대화가 없어요.<br />진행 중인 캠페인 상세에서 담당자에게 문의할 수 있어요.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {threads.map(t => {
              const fromAdmin = t.lastSender === 'admin'
              return (
                <Link key={t.cid} href={`/messages/${t.cid}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#211A33', color: '#F3EEE2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>S</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#211A33' }}>{t.camp}</span>
                        {fromAdmin && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#e65100', borderRadius: 100, padding: '1px 6px' }}>NEW</span>}
                      </div>
                      <p style={{ fontSize: 13, color: fromAdmin ? '#211A33' : 'rgba(33,26,51,.55)', fontWeight: fromAdmin ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {fromAdmin ? '담당자: ' : '나: '}{t.last}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(33,26,51,.4)', flexShrink: 0 }}>{new Date(t.lastAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
