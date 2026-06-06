'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Msg { id: string; sender: string; body: string; created_at: string }

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>() // campaign_id
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [title, setTitle] = useState('메시지')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const u = data.session.user.id
      setUid(u)
      supabase.from('campaigns').select('name, brands(name)').eq('id', id).single().then(({ data: cm }: any) => {
        if (cm) setTitle(cm.name || '메시지')
      })
      load(u)
    })
  }, [id])

  async function load(u: string) {
    const { data } = await supabase.from('messages').select('*').eq('campaign_id', id).eq('influencer_id', u).order('created_at')
    setMsgs((data as Msg[]) || [])
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function send() {
    if (!text.trim() || !uid || sending) return
    const body = text.trim()
    setText(''); setSending(true)
    await supabase.from('messages').insert([{ campaign_id: id, influencer_id: uid, sender: 'influencer', body }])
    setSending(false)
    load(uid)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, background: '#F3EEE2', borderBottom: '1px solid rgba(33,26,51,.1)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#211A33" strokeWidth={2.5}><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(33,26,51,.4)', fontFamily: "'JetBrains Mono',monospace" }}>관리자와 1:1</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#211A33' }}>{title}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(33,26,51,.4)', fontSize: 13, marginTop: 40 }}>아직 대화가 없어요. 궁금한 점을 남겨보세요.</p>
        ) : msgs.map(m => {
          const mine = m.sender === 'influencer'
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '76%', background: mine ? '#211A33' : '#fff', color: mine ? '#F3EEE2' : '#211A33', border: mine ? 'none' : '1px solid rgba(33,26,51,.1)', borderRadius: 14, padding: '10px 14px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {!mine && <p style={{ fontSize: 10, color: 'rgba(33,26,51,.4)', marginBottom: 3, fontWeight: 600 }}>관리자</p>}
                {m.body}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: '#F3EEE2', borderTop: '1px solid rgba(33,26,51,.1)', padding: '10px 12px', display: 'flex', gap: 8, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} placeholder="메시지 입력..."
          style={{ flex: 1, background: '#fff', border: '1px solid rgba(33,26,51,.18)', borderRadius: 100, padding: '11px 16px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={send} disabled={!text.trim() || sending}
          style={{ background: text.trim() ? '#211A33' : 'rgba(33,26,51,.2)', color: '#F3EEE2', border: 'none', borderRadius: 100, padding: '0 18px', fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default' }}>전송</button>
      </div>
    </div>
  )
}
