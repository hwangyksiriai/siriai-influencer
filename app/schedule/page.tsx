'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

interface Application {
  id: string
  status: string
  campaigns: {
    id: string
    name: string
    upload_start: string
    upload_end: string
    content_type: string
    brands: { name: string }
  }
}

const statusLabel: Record<string, string> = { scouted: '섭외', pending: '대기', in_progress: '진행', not_done: '미진행' }
const statusColor: Record<string, string> = { scouted: '#2A6FDB', pending: '#e65100', in_progress: '#2e7d32', not_done: '#c62828' }
const ACTIVE = ['pending', 'in_progress', 'scouted']

function getDday(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return '완료'
  if (diff === 0) return 'D-day'
  return `D-${diff}`
}

function Card({ a }: { a: Application }) {
  const dday = getDday(a.campaigns?.upload_end)
  return (
    <Link href={`/messages/${a.campaigns?.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'rgba(255,255,255,.7)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 48, height: 48, background: '#F3EEE2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(33,26,51,.1)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'rgba(33,26,51,.4)' }}>{a.campaigns?.content_type?.slice(0, 2)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: 'rgba(33,26,51,.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{a.campaigns?.brands?.name}</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#211A33', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.campaigns?.name}</p>
          <p style={{ fontSize: 11, color: 'rgba(33,26,51,.5)' }}>
            <span style={{ fontWeight: 700, color: statusColor[a.status] }}>{statusLabel[a.status] || a.status}</span>
            {a.campaigns?.upload_end ? ` · 업로드 ~${a.campaigns.upload_end}` : ''}
            <span style={{ color: '#2A6FDB' }}> · 💬 메시지</span>
          </p>
        </div>
        {dday && <span style={{ flexShrink: 0, background: dday === '완료' ? 'rgba(33,26,51,.1)' : '#211A33', color: dday === '완료' ? 'rgba(33,26,51,.4)' : '#F3EEE2', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{dday}</span>}
      </div>
    </Link>
  )
}

export default function SchedulePage() {
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const { data: applications } = await supabase
        .from('applications')
        .select('*, campaigns(id, name, upload_start, upload_end, content_type, brands(name))')
        .eq('influencer_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setApps((applications as Application[]) || [])
      setLoading(false)
    })
  }, [])

  const active = apps.filter(a => ACTIVE.includes(a.status))
  const past = apps.filter(a => !ACTIVE.includes(a.status))

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 80 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(33,26,51,.08)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>스케줄</h1>
      </div>

      <main style={{ padding: '16px 20px' }}>
        {loading ? (
          <p style={{ color: 'rgba(33,26,51,.4)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
        ) : (
          <>
            {/* 진행 중 */}
            {active.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0' }}>
                <p style={{ fontSize: 28, marginBottom: 12 }}>📋</p>
                <p style={{ fontSize: 15, color: 'rgba(33,26,51,.5)' }}>진행 중인 캠페인이 없어요.</p>
                <Link href="/home" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#2A6FDB', textDecoration: 'none' }}>캠페인 둘러보기 →</Link>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(33,26,51,.4)', marginBottom: 10 }}>진행 중</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {active.map(a => <Card key={a.id} a={a} />)}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Link href="/upload">
                    <button style={{ width: '100%', background: '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      콘텐츠 링크 업로드
                    </button>
                  </Link>
                </div>
              </>
            )}

            {/* 지난 스케줄 */}
            {past.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(33,26,51,.4)', marginBottom: 10 }}>지난 스케줄</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: .85 }}>
                  {past.map(a => <Card key={a.id} a={a} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
