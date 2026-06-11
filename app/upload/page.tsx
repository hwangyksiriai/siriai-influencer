'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { T, catKey } from '@/lib/theme'
import { Ico, Card, Monogram, AppHeader } from '@/components/ui'

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

// 인스타그램·유튜브 링크 형식 검증
const LINK_PATTERN = /^https?:\/\/(www\.)?(instagram\.com|youtu\.be|youtube\.com)\//i

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
  const [submitError, setSubmitError] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [focusedCheck, setFocusedCheck] = useState<string | null>(null)

  async function loadSubs(userId: string) {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, link, submitted_at, verified, applications!inner(influencer_id, campaigns(name))')
      .eq('applications.influencer_id', userId)
      .order('submitted_at', { ascending: false })
    if (error) return // 실패 시 기존 내역 유지
    setSubs((submissions as unknown as Submission[]) || [])
  }

  async function loadApps(userId: string) {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('id, upload_end_override, campaigns(name, upload_end, collab_required)')
      .eq('influencer_id', userId)
      .eq('status', 'in_progress')
    if (error) { setLoadError(true); return } // 실패 시 기존 상태 유지 + 에러 표시
    setLoadError(false)
    setApps((applications as unknown as Application[]) || [])
    if (applications?.length) setSelectedApp(prev => prev || applications[0].id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const userId = data.session.user.id
      setUid(userId)
      await loadApps(userId)
      await loadSubs(userId)
    })
  }, [])

  const selected = apps.find(a => a.id === selectedApp)
  const collabRequired = !!selected?.campaigns?.collab_required
  // #18 개별 연장 마감일이 있으면 우선 적용
  const uploadEnd = selected?.upload_end_override || selected?.campaigns?.upload_end || ''
  // #17 업로드 마감일이 지나면 업로드 불가
  const expired = !!uploadEnd && todayStr() > uploadEnd
  const linkValid = LINK_PATTERN.test(link.trim())
  const canSubmit = !expired && !!link.trim() && linkValid && !!selectedApp && confirmTag && (!collabRequired || confirmCollab)

  function isExpired(a: Application) {
    const e = a.upload_end_override || a.campaigns?.upload_end
    return !!e && todayStr() > e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError('')
    const { error } = await supabase.from('submissions').insert([{
      application_id: selectedApp,
      link: link.trim(),
      submitted_at: new Date().toISOString(),
      verified: false,
    }])
    if (error) {
      setSubmitting(false)
      setSubmitError('등록에 실패했어요. 다시 시도해 주세요.')
      return
    }
    setSubmitting(false)
    setDone(true)
    if (uid) loadSubs(uid)
  }

  const selectedName = selected?.campaigns?.name || ''
  const monoLetter = selectedName.trim().charAt(0) || '·'

  // 업로드 전 확인 체크리스트 항목 (실제 체크박스와 1:1 매핑)
  const checks: { key: 'tag' | 'collab'; label: string; checked: boolean; toggle: () => void }[] = [
    { key: 'tag', label: '게시물에 브랜드 계정을 태그했어요.', checked: confirmTag, toggle: () => setConfirmTag(v => !v) },
    ...(collabRequired
      ? [{ key: 'collab' as const, label: '공동작업자(브랜드 계정)를 추가했어요.', checked: confirmCollab, toggle: () => setConfirmCollab(v => !v) }]
      : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, paddingBottom: 120 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
          <AppHeader kicker="콘텐츠 제출" title="Upload Studio" />

          {loadError ? (
            /* 데이터 조회 실패 — 빈 상태와 분리된 에러 화면 */
            <div style={{ padding: `8px ${T.pad}px` }}>
              <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>일시적인 오류가 발생했어요</p>
                <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, marginBottom: 22 }}>네트워크 상태를 확인한 뒤<br />다시 시도해 주세요.</p>
                <button type="button" onClick={() => { if (uid) { loadApps(uid); loadSubs(uid) } }}
                  style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '12px 28px', fontSize: 14, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer' }}>
                  다시 시도
                </button>
              </Card>
            </div>
          ) : done ? (
            /* 등록 완료 화면 */
            <div style={{ padding: `8px ${T.pad}px` }}>
              <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: 40, marginBottom: 16 }}>✅</p>
                <h2 style={{ fontSize: 24, fontFamily: T.fontDisplay, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink, marginBottom: 8 }}>등록됐어요!</h2>
                <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.6, marginBottom: 28 }}>콘텐츠 링크가 등록됐어요.<br />검수 후 정산이 진행돼요.</p>
                <button onClick={() => { setDone(false); setLink(''); setConfirmTag(false); setConfirmCollab(false) }}
                  style={{ background: T.accent, color: T.accentInk, border: 'none', borderRadius: 100, padding: '12px 28px', fontSize: 14, fontWeight: 700, fontFamily: T.fontUI, cursor: 'pointer' }}>
                  다른 콘텐츠 등록하기
                </button>
              </Card>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 제출 캠페인 카드 */}
              <div style={{ padding: `4px ${T.pad}px 0` }}>
                <Card pad={false} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14 }}>
                  <Monogram letter={monoLetter} cat={catKey(null)} size={48} radius={14} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.ink3, fontWeight: 600 }}>제출 캠페인</div>
                    {apps.length === 0 ? (
                      <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink2, letterSpacing: '-0.02em' }}>업로드할 캠페인이 없어요</div>
                    ) : (
                      <>
                        <div style={{ fontFamily: T.fontUI, fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedName}</div>
                        {/* au-input: globals.css 의 ▾ 배경 화살표 사용 (background 단축속성 대신 backgroundColor 로 화살표 보존) */}
                        <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)} aria-label="캠페인 선택" className="au-input"
                          style={{ marginTop: 6, maxWidth: '100%', minHeight: 44, backgroundColor: T.surface, border: `1px solid ${T.line}`, borderRadius: 999, padding: '10px 38px 10px 14px', fontSize: 16, color: T.ink2, fontFamily: T.fontUI, fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                          {apps.map(a => (
                            <option key={a.id} value={a.id}>{a.campaigns?.name}{isExpired(a) ? ' (마감)' : ''}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                </Card>
                {!!uploadEnd && (
                  <p style={{ fontSize: 12, color: expired ? T.danger : T.ink3, margin: '8px 2px 0' }}>
                    업로드 마감: {uploadEnd}{expired ? ' · 마감됨' : ''}
                  </p>
                )}
              </div>

              {expired ? (
                /* #17 마감 시 업로드 차단 */
                <div style={{ padding: `0 ${T.pad}px` }}>
                  <Card style={{ background: T.blush, border: 'none', textAlign: 'center', padding: 22 }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>⏰</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: T.danger, marginBottom: 6 }}>업로드 기간이 마감됐어요</p>
                    <p style={{ fontSize: 13, color: T.blushInk, lineHeight: 1.6 }}>
                      마감일({uploadEnd})이 지나 업로드할 수 없어요.<br />일정 연장이 필요하면 담당자에게 문의해 주세요.
                    </p>
                  </Card>
                </div>
              ) : (
                <>
                  {/* 콘텐츠 링크 */}
                  <div style={{ padding: `0 ${T.pad}px` }}>
                    <div style={{ fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 10 }}>콘텐츠 링크</div>
                    <Card style={{ padding: 16 }}>
                      <textarea value={link} onChange={e => { setLink(e.target.value); if (submitError) setSubmitError('') }}
                        placeholder="인스타그램 또는 유튜브 링크를 입력해 주세요."
                        rows={3}
                        inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontFamily: T.fontUI, color: T.ink, resize: 'none', background: 'transparent', lineHeight: 1.55 }} />
                    </Card>
                    {/* 링크 형식 실시간 검증 */}
                    {!!link.trim() && !linkValid && (
                      <p style={{ fontSize: 12.5, color: T.danger, margin: '8px 2px 0' }}>인스타그램 또는 유튜브 링크 형식이 아니에요</p>
                    )}
                  </div>

                  {/* 업로드 전 확인 (#21) — 가이드라인 체크 비주얼 + 실제 체크박스 */}
                  <div style={{ padding: `0 ${T.pad}px` }}>
                    <Card style={{ padding: 16, background: T.wash, border: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                        <Ico.spark width="17" height="17" />
                        <span style={{ fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 700, color: T.ink }}>업로드 전 확인</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {checks.map(c => (
                          <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input type="checkbox" checked={c.checked} onChange={c.toggle}
                              onFocus={() => setFocusedCheck(c.key)} onBlur={() => setFocusedCheck(null)}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                            <span style={{ width: 20, height: 20, borderRadius: 999, flexShrink: 0, background: c.checked ? T.sage : T.surface, color: T.sageInk, border: c.checked ? 'none' : `1.5px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: focusedCheck === c.key ? '0 0 0 3.5px rgba(26,25,22,0.14)' : 'none', transition: 'box-shadow .15s' }}>
                              {c.checked && <Ico.check width="13" height="13" />}
                            </span>
                            <span style={{ fontFamily: T.fontUI, fontSize: 13.5, color: c.checked ? T.ink2 : T.ink, textDecoration: c.checked ? 'line-through' : 'none' }}>{c.label}</span>
                          </label>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* 제출 버튼 */}
                  <div style={{ padding: `6px ${T.pad}px 0` }}>
                    <button type="submit" disabled={!canSubmit || submitting}
                      style={{ width: '100%', border: 'none', background: canSubmit ? T.accent : T.surface2, color: canSubmit ? T.accentInk : T.ink3, fontFamily: T.fontUI, fontWeight: 700, fontSize: 16, padding: '17px', borderRadius: T.radiusSm, cursor: canSubmit && !submitting ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s' }}>
                      <Ico.upload width="20" height="20" /> {submitting ? '등록 중...' : '등록하기'}
                    </button>
                    {/* 등록 실패 인라인 에러 */}
                    {!!submitError && (
                      <p className="au-error" style={{ fontSize: 13, fontWeight: 600, color: T.danger, textAlign: 'center', margin: '10px 0 0' }}>{submitError}</p>
                    )}
                  </div>
                </>
              )}
            </form>
          )}

          {/* #16 등록한 콘텐츠 내역 */}
          {!done && subs.length > 0 && (
            <div style={{ padding: `22px ${T.pad}px 0` }}>
              <p style={{ fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 10 }}>
                등록한 콘텐츠 <span style={{ color: T.ink3, fontWeight: 500 }}>{subs.length}</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {subs.map(s => (
                  <Card key={s.id} style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.applications?.campaigns?.name || '캠페인'}
                      </p>
                      <span style={{ flexShrink: 0, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999, color: s.verified ? T.sageInk : T.butterInk, background: s.verified ? T.sage : T.butter }}>
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
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
