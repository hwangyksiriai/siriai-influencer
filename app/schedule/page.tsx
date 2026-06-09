'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T } from '@/lib/theme'
import { Ico, Pill, Card, IconBtn, AppHeader } from '@/components/ui'

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
// 상태 → 카드 배경/잉크 색 매핑
const statusBg: Record<string, string> = { scouted: T.lav, pending: T.butter, in_progress: T.sage, not_done: T.blush }
const statusInk: Record<string, string> = { scouted: T.lavInk, pending: T.butterInk, in_progress: T.sageInk, not_done: T.blushInk }
const ACTIVE = ['pending', 'in_progress', 'scouted']

function getDday(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return '완료'
  if (diff === 0) return 'D-day'
  return `D-${diff}`
}

// 타임라인 항목 — 왼쪽 dot+연결선, 오른쪽 컬러 카드
function TimelineItem({ a, last, past = false }: { a: Application; last: boolean; past?: boolean }) {
  const router = useRouter()
  const dday = getDday(a.campaigns?.upload_end)
  const bg = past ? T.surface2 : (statusBg[a.status] || T.surface2)
  const ink = past ? T.ink2 : (statusInk[a.status] || T.ink2)
  const dot = past ? T.ink3 : (statusBg[a.status] || T.ink3)

  return (
    <div style={{ display: 'flex', gap: 14, opacity: past ? 0.6 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: dot, border: `2.5px solid ${T.surface}`, boxShadow: `0 0 0 1.5px ${dot}` }} />
        {!last && <span style={{ flex: 1, width: 2, background: T.line, marginTop: 2 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
        <Card
          onClick={() => router.push(`/messages/${a.campaigns?.id}`)}
          style={{ padding: 16, background: bg, border: 'none', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill bg="rgba(255,255,255,0.55)" ink={ink} size={11}>{statusLabel[a.status] || a.status}</Pill>
                {dday && <span style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, color: ink, opacity: 0.7 }}>{dday}</span>}
              </div>
              <div style={{ fontFamily: T.fontUI, fontWeight: 700, fontSize: 16, color: ink, letterSpacing: '-0.02em', margin: '9px 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.campaigns?.name}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.fontUI, fontSize: 12.5, color: ink, opacity: 0.75 }}>
                <Ico.pin width="14" height="14" />
                {a.campaigns?.brands?.name}{a.campaigns?.upload_end ? ` · 업로드 ~${a.campaigns.upload_end}` : ''}
              </div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.5)', color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico.chevR width="16" height="16" />
            </div>
          </div>
        </Card>
      </div>
    </div>
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
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, paddingBottom: 120 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <AppHeader kicker="진행 일정" title="Schedule" right={<IconBtn icon={Ico.calendar} />} />

        {loading ? (
          <p style={{ color: T.ink3, fontSize: 14, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
        ) : active.length === 0 && past.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <p style={{ fontSize: 28, marginBottom: 12 }}>📋</p>
            <p style={{ fontSize: 15, color: T.ink2 }}>진행 중인 캠페인이 없어요.</p>
            <Link href="/home" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: T.lavInk, textDecoration: 'none' }}>캠페인 둘러보기 →</Link>
          </div>
        ) : (
          <>
            {/* 진행 중 */}
            <div style={{ padding: `0 ${T.pad}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 19, color: T.ink, letterSpacing: '-0.02em' }}>진행 중 <span style={{ color: T.ink3 }}>{active.length}</span></h3>
                <Pill bg={T.surface2} ink={T.ink2} size={12}>Timeline</Pill>
              </div>
              {active.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 15, color: T.ink2 }}>진행 중인 캠페인이 없어요.</p>
                  <Link href="/home" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: T.lavInk, textDecoration: 'none' }}>캠페인 둘러보기 →</Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {active.map((a, i) => <TimelineItem key={a.id} a={a} last={i === active.length - 1} />)}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Link href="/upload">
                      <button style={{ width: '100%', background: T.accent, color: T.accentInk, border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Ico.upload width={16} height={16} />
                        콘텐츠 링크 업로드
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* 지난 스케줄 */}
            {past.length > 0 && (
              <div style={{ padding: `0 ${T.pad}px` }}>
                <h3 style={{ margin: '0 0 12px', fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 19, color: T.ink, letterSpacing: '-0.02em' }}>지난 스케줄 <span style={{ color: T.ink3 }}>{past.length}</span></h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {past.map((a, i) => <TimelineItem key={a.id} a={a} last={i === past.length - 1} past />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
