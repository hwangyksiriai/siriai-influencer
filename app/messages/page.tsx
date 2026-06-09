'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T } from '@/lib/theme'

interface Msg { id: string; campaign_id: string; sender: string; body: string; created_at: string; campaigns: { name: string; brands: { name: string } | null } | null }
interface Thread { cid: string; camp: string; brand: string; last: string; lastAt: string; lastSender: string }

export default function InfMessagesPage() {
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  // 스레드 목록 최초 로드
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const u = data.session.user.id
      setUid(u)

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, campaign_id, sender, body, created_at, campaigns(name, brands(name))')
        .eq('influencer_id', u)
        .order('created_at', { ascending: false })

      const map = new Map<string, Thread>()
      for (const m of (msgs as unknown as Msg[]) || []) {
        if (!map.has(m.campaign_id)) map.set(m.campaign_id, { cid: m.campaign_id, camp: m.campaigns?.name || '캠페인', brand: m.campaigns?.brands?.name || '', last: m.body, lastAt: m.created_at, lastSender: m.sender })
      }
      setThreads(Array.from(map.values()))
      setLoading(false)
    })
  }, [])

  // Realtime — 새 메시지 오면 스레드 목록 자동 갱신
  useEffect(() => {
    if (!uid) return

    const channel = supabase
      .channel(`threads-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `influencer_id=eq.${uid}` },
        async (payload) => {
          const m = payload.new as any
          // 캠페인 이름은 이미 threads에 있을 수 있으므로 기존 정보 재활용 or fetch
          let campName = ''
          let brandName = ''
          setThreads(prev => {
            const existing = prev.find(t => t.cid === m.campaign_id)
            campName = existing?.camp || ''
            brandName = existing?.brand || ''
            return prev
          })

          // 캠페인 정보가 없으면 새로 fetch
          if (!campName) {
            const { data: cm } = await supabase.from('campaigns').select('name, brands(name)').eq('id', m.campaign_id).single()
            campName = (cm as any)?.name || '캠페인'
            brandName = (cm as any)?.brands?.name || ''
          }

          const updated: Thread = {
            cid: m.campaign_id,
            camp: campName,
            brand: brandName,
            last: m.body,
            lastAt: m.created_at,
            lastSender: m.sender,
          }

          setThreads(prev => {
            const idx = prev.findIndex(t => t.cid === m.campaign_id)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = updated
              return next
            }
            return [updated, ...prev]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [uid])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
      <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${T.line}`, position: 'sticky', top: 0, background: T.bg, zIndex: 10 }}>
        <h1 style={{ fontSize: 20, fontFamily: T.fontDisplay, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink }}>메시지</h1>
        <p style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>담당자와 1:1로 대화해요</p>
      </div>

      <main style={{ padding: '14px 20px' }}>
        {loading ? (
          <p style={{ color: T.ink3, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>💬</p>
            <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.6 }}>아직 대화가 없어요.<br />진행 중인 캠페인 상세에서 담당자에게 문의할 수 있어요.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {threads.map(t => {
              const fromAdmin = t.lastSender === 'admin'
              return (
                <Link key={t.cid} href={`/messages/${t.cid}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: T.accent, color: T.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>S</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{t.camp}</span>
                        {fromAdmin && <span style={{ fontSize: 9, fontWeight: 700, color: T.blushInk, background: T.blush, borderRadius: 100, padding: '1px 6px' }}>NEW</span>}
                      </div>
                      <p style={{ fontSize: 13, color: fromAdmin ? T.ink : T.ink2, fontWeight: fromAdmin ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {fromAdmin ? '담당자: ' : '나: '}{t.last}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: T.ink3, flexShrink: 0 }}>{new Date(t.lastAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
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
