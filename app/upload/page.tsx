'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T } from '@/lib/theme'

interface Application {
  id: string
  upload_end_override: string | null
  campaigns: { name: string; upload_end: string; collab_required: boolean }
}

interface Submission {
  id: string
  link: string
  submitted_at: string
  verified: boolean
  applications: { campaigns: { name: string } } | null
}

// 로컬 기준 오늘 날짜 (YYYY-MM-DD)
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function UploadPage() {
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>([])
  const [subs, setSubs] = useState<Submission[]>([])
  const [selectedApp, setSelectedApp] = useState('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [confirmTag, setConfirmTag] = useState(false)
  const [confirmCollab, setConfirmCollab] = useState(false)
  const [uid, setUid] = useState('')

  async function loadSubs(userId: string) {
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, link, submitted_at, verified, applications!inner(influencer_id, campaigns(name))')
      .eq('applications.influencer_id', userId)
      .order('submitted_at', { ascending: false })
    setSubs((submissions as unknown as Submission[]) || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const userId = data.session.user.id
      setUid(userId)
      const { data: applications } = await supabase
        .from('applications')
        .select('id, upload_end_override, campaigns(name, upload_end, collab_required)')
        .eq('influencer_id', userId)
        .eq('status', 'in_progress')
      setApps((applications as unknown as Application[]) || [])
      if (applications?.length) setSelectedApp(applications[0].id)
      await loadSubs(userId)
    })
  }, [])

  const selected = apps.find(a => a.id === selectedApp)
  const collabRequired = !!selected?.campaigns?.collab_required
  // #18 개별 연장 마감일이 있으면 우선 적용
  const uploadEnd = selected?.upload_end_override || selected?.campaigns?.upload_end || ''
  // #17 업로드 마감일이 지나면 업로드 불가
  const expired = !!uploadEnd && todayStr() > uploadEnd
  const canSubmit = !expired && !!link.trim() && !!selectedApp && confirmTag && (!collabRequired || confirmCollab)

  function isExpired(a: Application) {
    const e = a.upload_end_override || a.campaigns?.upload_end
    return !!e && todayStr() > e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    await supabase.from('submissions').insert([{
      application_id: selectedApp,
      link: link.trim(),
      submitted_at: new Date().toISOString(),
      verified: false,
    }])
    setSubmitting(false)
    setDone(true)
    if (uid) loadSubs(uid)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.line}`, background: T.bg }}>
        <h1 style={{ fontSize: 26, fontFamily: T.fontDisplay, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink }}>업로드</h1>
      </div>

      <main style={{ padding: '24px 20px' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>✅</p>
            <h2 style={{ fontSize: 24, fontFamily: T.fontDisplay, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, marginBottom: 8 }}>등록됐어요!</h2>
            <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.6, marginBottom: 28 }}>콘텐츠 링크가 등록됐어요.<br/>검수 후 정산이 진행돼요.</p>
            <button onClick={() => { setDone(false); setLink(''); setConfirmTag(false); setConfirmCollab(false) }}
              style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              다른 콘텐츠 등록하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontFamily: T.fontUI, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: T.ink3, display: 'block', marginBottom: 8 }}>
                캠페인 선택
              </label>
              {apps.length === 0 ? (
                <p style={{ fontSize: 14, color: T.ink2, padding: '12px 0' }}>업로드할 캠페인이 없어요.</p>
              ) : (
                <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)}
                  style={{ width: '100%', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: T.ink, fontFamily: 'inherit', outline: 'none', appearance: 'none' }}>
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.campaigns?.name}{isExpired(a) ? ' (마감)' : ''}</option>
                  ))}
                </select>
              )}
              {!!uploadEnd && (
                <p style={{ fontSize: 12, color: expired ? T.danger : T.ink3, marginTop: 8 }}>
                  업로드 마감: {uploadEnd}{expired ? ' · 마감됨' : ''}
                </p>
              )}
            </div>

            {expired ? (
              /* #17 마감 시 업로드 차단 */
              <div style={{ background: 'rgba(176,71,59,0.07)', border: `1px solid ${T.line}`, borderRadius: 14, padding: '18px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>⏰</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.danger, marginBottom: 6 }}>업로드 기간이 마감됐어요</p>
                <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6 }}>
                  마감일({uploadEnd})이 지나 업로드할 수 없어요.<br/>일정 연장이 필요하면 담당자에게 문의해 주세요.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ fontFamily: T.fontUI, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: T.ink3, display: 'block', marginBottom: 8 }}>
                    콘텐츠 링크
                  </label>
                  <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px' }}>
                    <textarea value={link} onChange={e => setLink(e.target.value)}
                      placeholder="인스타그램 또는 유튜브 링크를 입력해 주세요."
                      rows={3}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', color: T.ink, resize: 'none', background: 'transparent' }} />
                  </div>
                </div>

                {/* 업로드 전 확인 (#21) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>업로드 전 확인</p>
                  <label style={{ display: 'flex', gap: 8, fontSize: 13, color: T.ink2, cursor: 'pointer', lineHeight: 1.5 }}>
                    <input type="checkbox" checked={confirmTag} onChange={e => setConfirmTag(e.target.checked)} style={{ width: 16, height: 16, marginTop: 1, accentColor: T.accent, flexShrink: 0 }} />
                    게시물에 브랜드 계정을 태그했어요.
                  </label>
                  {collabRequired && (
                    <label style={{ display: 'flex', gap: 8, fontSize: 13, color: T.ink2, cursor: 'pointer', lineHeight: 1.5 }}>
                      <input type="checkbox" checked={confirmCollab} onChange={e => setConfirmCollab(e.target.checked)} style={{ width: 16, height: 16, marginTop: 1, accentColor: T.accent, flexShrink: 0 }} />
                      공동작업자(브랜드 계정)를 추가했어요.
                    </label>
                  )}
                </div>

                <button type="submit" disabled={!canSubmit || submitting}
                  style={{ width: '100%', background: canSubmit ? T.accent : T.surface2, color: canSubmit ? T.accentInk : T.ink3, border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', marginTop: 8, transition: 'background .2s' }}>
                  {submitting ? '등록 중...' : '등록하기'}
                </button>
              </>
            )}
          </form>
        )}

        {/* #16 등록한 콘텐츠 내역 */}
        {!done && subs.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <p style={{ fontFamily: T.fontUI, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: T.ink3, marginBottom: 12 }}>
              등록한 콘텐츠 ({subs.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subs.map(s => (
                <div key={s.id} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.applications?.campaigns?.name || '캠페인'}
                    </p>
                    <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, color: s.verified ? T.sageInk : T.butterInk, background: s.verified ? T.sage : T.butter }}>
                      {s.verified ? '인증완료' : '검수중'}
                    </span>
                  </div>
                  <a href={s.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: T.lavInk, textDecoration: 'none', wordBreak: 'break-all', display: 'block' }}>
                    {s.link}
                  </a>
                  <p style={{ fontSize: 11, color: T.ink3, marginTop: 4 }}>
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('ko-KR') : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
