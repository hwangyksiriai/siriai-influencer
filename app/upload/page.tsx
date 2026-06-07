'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

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
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 80 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(33,26,51,.08)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>업로드</h1>
      </div>

      <main style={{ padding: '24px 20px' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>✅</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>등록됐어요!</h2>
            <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)', lineHeight: 1.6, marginBottom: 28 }}>콘텐츠 링크가 등록됐어요.<br/>검수 후 정산이 진행돼요.</p>
            <button onClick={() => { setDone(false); setLink(''); setConfirmTag(false); setConfirmCollab(false) }}
              style={{ background: '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 100, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              다른 콘텐츠 등록하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(33,26,51,.46)', display: 'block', marginBottom: 8 }}>
                캠페인 선택
              </label>
              {apps.length === 0 ? (
                <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)', padding: '12px 0' }}>업로드할 캠페인이 없어요.</p>
              ) : (
                <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.18)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#211A33', fontFamily: 'inherit', outline: 'none', appearance: 'none' }}>
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.campaigns?.name}{isExpired(a) ? ' (마감)' : ''}</option>
                  ))}
                </select>
              )}
              {!!uploadEnd && (
                <p style={{ fontSize: 12, color: expired ? '#c62828' : 'rgba(33,26,51,.45)', marginTop: 8 }}>
                  업로드 마감: {uploadEnd}{expired ? ' · 마감됨' : ''}
                </p>
              )}
            </div>

            {expired ? (
              /* #17 마감 시 업로드 차단 */
              <div style={{ background: 'rgba(198,40,40,.06)', border: '1px solid rgba(198,40,40,.2)', borderRadius: 12, padding: '18px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>⏰</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#c62828', marginBottom: 6 }}>업로드 기간이 마감됐어요</p>
                <p style={{ fontSize: 13, color: 'rgba(33,26,51,.6)', lineHeight: 1.6 }}>
                  마감일({uploadEnd})이 지나 업로드할 수 없어요.<br/>일정 연장이 필요하면 담당자에게 문의해 주세요.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(33,26,51,.46)', display: 'block', marginBottom: 8 }}>
                    콘텐츠 링크
                  </label>
                  <div style={{ border: '1.5px solid rgba(33,26,51,.18)', borderRadius: 12, padding: '14px' }}>
                    <textarea value={link} onChange={e => setLink(e.target.value)}
                      placeholder="인스타그램 또는 유튜브 링크를 입력해 주세요."
                      rows={3}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'inherit', color: '#211A33', resize: 'none', background: 'transparent' }} />
                  </div>
                </div>

                {/* 업로드 전 확인 (#21) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,.5)', border: '1px solid rgba(33,26,51,.12)', borderRadius: 12, padding: '14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#211A33' }}>업로드 전 확인</p>
                  <label style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(33,26,51,.75)', cursor: 'pointer', lineHeight: 1.5 }}>
                    <input type="checkbox" checked={confirmTag} onChange={e => setConfirmTag(e.target.checked)} style={{ width: 16, height: 16, marginTop: 1, accentColor: '#211A33', flexShrink: 0 }} />
                    게시물에 브랜드 계정을 태그했어요.
                  </label>
                  {collabRequired && (
                    <label style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(33,26,51,.75)', cursor: 'pointer', lineHeight: 1.5 }}>
                      <input type="checkbox" checked={confirmCollab} onChange={e => setConfirmCollab(e.target.checked)} style={{ width: 16, height: 16, marginTop: 1, accentColor: '#211A33', flexShrink: 0 }} />
                      공동작업자(브랜드 계정)를 추가했어요.
                    </label>
                  )}
                </div>

                <button type="submit" disabled={!canSubmit || submitting}
                  style={{ width: '100%', background: canSubmit ? '#211A33' : 'rgba(33,26,51,.2)', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', marginTop: 8, transition: 'background .2s' }}>
                  {submitting ? '등록 중...' : '등록하기'}
                </button>
              </>
            )}
          </form>
        )}

        {/* #16 등록한 콘텐츠 내역 */}
        {!done && subs.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(33,26,51,.46)', marginBottom: 12 }}>
              등록한 콘텐츠 ({subs.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subs.map(s => (
                <div key={s.id} style={{ background: 'rgba(255,255,255,.55)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#211A33', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.applications?.campaigns?.name || '캠페인'}
                    </p>
                    <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, color: s.verified ? '#2e7d32' : '#e65100', background: s.verified ? 'rgba(46,125,50,.1)' : 'rgba(230,81,0,.1)' }}>
                      {s.verified ? '인증완료' : '검수중'}
                    </span>
                  </div>
                  <a href={s.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#2A6FDB', textDecoration: 'none', wordBreak: 'break-all', display: 'block' }}>
                    {s.link}
                  </a>
                  <p style={{ fontSize: 11, color: 'rgba(33,26,51,.4)', marginTop: 4 }}>
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
