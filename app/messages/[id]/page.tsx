'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isGuest } from '@/lib/guest'
import { T } from '@/lib/theme'

interface Msg { id: string; sender: string; body: string; created_at: string; influencer_id?: string }

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>() // campaign_id
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [title, setTitle] = useState('메시지')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true) // 첫 로드 전 '아직 대화가 없어요' 깜빡임 방지
  const [sendErr, setSendErr] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null) // 메시지 스크롤 영역
  const latestCountRef = useRef(0) // 폴링 중 새 메시지 감지용
  const errTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 초기 로드 + uid 세팅
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session && !isGuest()) { router.replace('/login'); return }
      if (!data.session) { setLoading(false); return } // 게스트: 대화 없음
      const u = data.session.user.id
      setUid(u)

      supabase.from('campaigns').select('name, brands(name)').eq('id', id).single().then(({ data: cm }: any) => {
        if (cm) setTitle(cm.name || '메시지')
      })

      await loadMsgs(u, true)
    })
  }, [id])

  // 3초마다 폴링 (uid 세팅 후 시작, 백그라운드 탭이면 스킵)
  useEffect(() => {
    if (!uid) return
    const timer = setInterval(() => {
      if (document.hidden) return
      loadMsgs(uid, false)
    }, 3000)
    // 탭 복귀 시 즉시 1회 로드
    const onVis = () => { if (!document.hidden) loadMsgs(uid, false) }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis) }
  }, [uid])

  // 언마운트 시 에러 타이머 정리
  useEffect(() => () => { if (errTimerRef.current) clearTimeout(errTimerRef.current) }, [])

  async function loadMsgs(u: string, scrollAlways: boolean) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('campaign_id', id)
      .eq('influencer_id', u)
      .order('created_at')
    // 에러 시 기존 메시지 유지 (빈 화면 깜빡임 방지)
    if (error) return
    const fresh = (data as Msg[]) || []

    // 스크롤이 하단 근처(80px 이내)일 때만 자동 스크롤
    const el = listRef.current
    const nearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80

    const hasNew = fresh.length > latestCountRef.current
    latestCountRef.current = fresh.length
    setMsgs(fresh)
    setLoading(false)

    // 읽음 처리: 마지막 열람 시각 저장 (목록 NEW 뱃지 기준)
    try {
      const readAt = fresh.length > 0 ? fresh[fresh.length - 1].created_at : new Date().toISOString()
      localStorage.setItem(`msg_read_${id}`, readAt)
    } catch { /* 저장 실패는 무시 */ }

    if (scrollAlways || (hasNew && nearBottom)) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  async function send() {
    if (!text.trim() || !uid || sending) return
    const body = text.trim()
    setSending(true)
    const { error } = await supabase.from('messages').insert([{ campaign_id: id, influencer_id: uid, sender: 'influencer', body }])
    setSending(false)
    if (error) {
      // 실패 시 입력 복원 + 인라인 에러 (3초 후 자동 소멸)
      setText(body)
      setSendErr('전송에 실패했어요. 다시 시도해 주세요.')
      if (errTimerRef.current) clearTimeout(errTimerRef.current)
      errTimerRef.current = setTimeout(() => setSendErr(''), 3000)
      return
    }
    setText('')
    await loadMsgs(uid, true)
  }

  return (
    <div className="dvh-screen" style={{ height: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.line}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10, flexShrink: 0 }}>
        <button onClick={() => router.back()} aria-label="뒤로가기"
          style={{ background: 'none', border: 'none', cursor: 'pointer', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, marginLeft: -12, flexShrink: 0 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={2.5}><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <div>
          <p style={{ fontSize: 10, color: T.ink3, fontFamily: T.fontUI }}>관리자와 1:1</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{title}</p>
        </div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: T.ink3, fontSize: 13, marginTop: 40 }}>불러오는 중...</p>
        ) : msgs.length === 0 ? (
          <p style={{ textAlign: 'center', color: T.ink3, fontSize: 13, marginTop: 40 }}>아직 대화가 없어요. 궁금한 점을 남겨보세요.</p>
        ) : msgs.map(m => {
          const mine = m.sender === 'influencer'
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '76%', background: mine ? T.accent : T.surface2, color: mine ? T.accentInk : T.ink, border: mine ? 'none' : `1px solid ${T.line}`, borderRadius: 16, padding: '10px 14px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {!mine && <p style={{ fontSize: 10, color: T.ink3, marginBottom: 3, fontWeight: 600 }}>관리자</p>}
                {m.body}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {sendErr && (
        <p className="au-error" style={{ color: T.danger, fontSize: 12, fontWeight: 600, textAlign: 'center', padding: '6px 12px', margin: 0, background: T.bg, flexShrink: 0 }}>{sendErr}</p>
      )}

      <div style={{ background: T.bg, borderTop: `1px solid ${T.line}`, padding: '10px 12px', display: 'flex', gap: 8, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send() }} placeholder="메시지 입력..."
          style={{ flex: 1, background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 100, padding: '11px 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={send} disabled={!text.trim() || sending}
          style={{ background: text.trim() ? T.accent : T.surface2, color: text.trim() ? T.accentInk : T.ink3, border: 'none', borderRadius: 100, padding: '0 18px', fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default' }}>전송</button>
      </div>
    </div>
  )
}
