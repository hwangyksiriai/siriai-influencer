'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isGuest } from '@/lib/guest'
import BottomNav from '@/components/BottomNav'
import { T } from '@/lib/theme'

interface Msg { id: string; campaign_id: string; sender: string; body: string; created_at: string; campaigns: { name: string; brands: { name: string } | null } | null }
interface Thread { cid: string; camp: string; brand: string; last: string; lastAt: string; lastSender: string }

// 마지막 열람 시각(localStorage)과 비교해 안 읽은 관리자 메시지인지 판단
function isUnread(t: Thread) {
  if (t.lastSender !== 'admin') return false
  if (typeof window === 'undefined') return false
  const readAt = localStorage.getItem(`msg_read_${t.cid}`)
  if (!readAt) return true
  return new Date(t.lastAt).getTime() > new Date(readAt).getTime()
}

export default function InfMessagesPage() {
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  async function loadThreads(u: string) {
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('id, campaign_id, sender, body, created_at, campaigns(name, brands(name))')
      .eq('influencer_id', u)
      .order('created_at', { ascending: false })

    // 에러 시 기존 스레드 유지 (빈 화면 깜빡임 방지)
    if (error) { setLoading(false); return }

    const map = new Map<string, Thread>()
    for (const m of (msgs as unknown as Msg[]) || []) {
      if (!map.has(m.campaign_id))
        map.set(m.campaign_id, {
          cid: m.campaign_id,
          camp: m.campaigns?.name || '캠페인',
          brand: m.campaigns?.brands?.name || '',
          last: m.body,
          lastAt: m.created_at,
          lastSender: m.sender,
        })
    }
    setThreads(Array.from(map.values()))
    setLoading(false)
  }

  // 초기 로드
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session && !isGuest()) { router.replace('/login'); return }
      if (!data.session) { setLoading(false); return } // 게스트: 대화 없음
      const u = data.session.user.id
      setUid(u)
      await loadThreads(u)
    })
  }, [])

  // 5초마다 폴링 (uid 세팅 후, 백그라운드 탭이면 스킵)
  useEffect(() => {
    if (!uid) return
    const timer = setInterval(() => {
      if (document.hidden) return
      loadThreads(uid)
    }, 5000)
    // 탭 복귀 시 즉시 1회 로드
    const onVis = () => { if (!document.hidden) loadThreads(uid) }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis) }
  }, [uid])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120, maxWidth: 480, margin: '0 auto' }}>
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
              const unread = isUnread(t) // 열람 이후 새 관리자 메시지일 때만 NEW
              return (
                <Link key={t.cid} href={`/messages/${t.cid}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: T.accent, color: T.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>S</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{t.camp}</span>
                        {unread && <span style={{ fontSize: 9, fontWeight: 700, color: T.blushInk, background: T.blush, borderRadius: 100, padding: '1px 6px' }}>NEW</span>}
                      </div>
                      <p style={{ fontSize: 13, color: unread ? T.ink : T.ink2, fontWeight: unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
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
