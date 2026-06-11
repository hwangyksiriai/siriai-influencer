'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { T } from '@/lib/theme'

interface Faq { id: string; category: string; question: string; answer: string }
interface Notice { id: string; title: string; body: string; pinned: boolean; created_at: string }
interface Inquiry { id: string; category: string | null; title: string | null; body: string; answer: string | null; status: string; created_at: string }

const TABS = [['notice', '공지사항'], ['faq', '자주 묻는 질문'], ['inquiry', '1:1 문의'], ['guide', '이용 가이드']] as const
type TabKey = typeof TABS[number][0]
const CATS = ['정산', '콘텐츠', '일정', '제품·배송', '계정', '기타']

const card: React.CSSProperties = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px' }
const inp: React.CSSProperties = { width: '100%', background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 16, color: T.ink, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

function SupportInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initTab = (params.get('tab') as TabKey) || 'notice'
  const [tab, setTab] = useState<TabKey>(initTab)
  const [uid, setUid] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [faqCat, setFaqCat] = useState('전체')
  const [form, setForm] = useState({ category: '정산', title: '', body: '' })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const id = data.session?.user.id || ''
      setUid(id)
      const [{ data: f }, { data: n }] = await Promise.all([
        supabase.from('faqs').select('id, category, question, answer').eq('published', true).order('sort'),
        supabase.from('notices').select('*').eq('published', true).order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      ])
      setFaqs((f as Faq[]) || [])
      setNotices((n as Notice[]) || [])
      if (id) await loadInquiries(id)
      setLoaded(true)
    })
  }, [])

  async function loadInquiries(id: string) {
    const { data, error } = await supabase.from('inquiries').select('*').eq('influencer_id', id).order('created_at', { ascending: false })
    if (error) return // 실패 시 기존 목록 유지
    setInquiries((data as Inquiry[]) || [])
  }

  async function submitInquiry() {
    if (sending) return
    if (!form.body.trim() || !uid) return
    setSending(true)
    setSendError('')
    const { error } = await supabase.from('inquiries').insert([{ influencer_id: uid, category: form.category, title: form.title.trim() || null, body: form.body.trim(), status: 'open' }])
    setSending(false)
    if (error) {
      // 실패 시 작성 내용 유지
      setSendError('문의 접수에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    setForm({ category: '정산', title: '', body: '' })
    setToast('문의가 접수됐어요 ✓')
    setTimeout(() => setToast(''), 2000)
    loadInquiries(uid)
  }

  const faqCats = ['전체', ...CATS.filter(c => faqs.some(f => f.category === c))]
  const shownFaqs = faqCat === '전체' ? faqs : faqs.filter(f => f.category === faqCat)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 40, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: 'max(10px, env(safe-area-inset-top)) 20px 0', borderBottom: `1px solid ${T.line}`, position: 'sticky', top: 0, background: T.bg, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <button type="button" onClick={() => router.back()} aria-label="뒤로가기"
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: T.ink, cursor: 'pointer', padding: 0, marginLeft: -12 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', color: T.ink }}>고객센터</h1>
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: 'none', border: 'none', borderBottom: tab === k ? `2px solid ${T.accent}` : '2px solid transparent', padding: '9px 13px', fontSize: 13, fontWeight: tab === k ? 700 : 500, color: tab === k ? T.ink : T.ink3, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>{l}</button>
          ))}
        </div>
      </div>

      <main style={{ padding: '18px 20px' }}>
        {tab === 'notice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!loaded ? <p style={{ fontSize: 14, color: T.ink3, textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p> :
              notices.length === 0 ? <p style={{ fontSize: 14, color: T.ink2, textAlign: 'center', padding: '40px 0' }}>공지사항이 없어요.</p> :
              notices.map(n => (
                <div key={n.id} style={card}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{n.pinned && <span style={{ color: T.butterInk }}>[필독] </span>}{n.title}</p>
                  {n.body && <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, marginTop: 6, whiteSpace: 'pre-wrap' }}>{n.body}</p>}
                  <p style={{ fontSize: 11, color: T.ink3, marginTop: 8 }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              ))}
          </div>
        )}

        {tab === 'faq' && (
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {faqCats.map(c => (
                <button key={c} onClick={() => setFaqCat(c)} style={{ borderRadius: 100, padding: '6px 13px', fontSize: 12, border: `1px solid ${T.line}`, cursor: 'pointer', background: faqCat === c ? T.accent : 'transparent', color: faqCat === c ? T.accentInk : T.ink }}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loaded && shownFaqs.length === 0 && <p style={{ fontSize: 14, color: T.ink2, textAlign: 'center', padding: '40px 0' }}>등록된 질문이 없어요.</p>}
              {shownFaqs.map(f => (
                <div key={f.id} style={card}>
                  <button type="button" onClick={() => setOpenFaq(o => o === f.id ? null : f.id)} aria-expanded={openFaq === f.id} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0, textAlign: 'left', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}><span style={{ color: T.lavInk, marginRight: 6 }}>Q</span>{f.question}</span>
                    <span style={{ fontSize: 16, color: T.ink3, transform: openFaq === f.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>⌄</span>
                  </button>
                  {openFaq === f.id && <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-wrap' }}>{f.answer}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inquiry' && (
          <div>
            {!uid ? (
              <p style={{ fontSize: 14, color: T.ink2, textAlign: 'center', padding: '20px 0' }}>로그인 후 이용할 수 있어요. <Link href="/login" style={{ color: T.lavInk }}>로그인</Link></p>
            ) : (
              <div style={{ ...card, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>새 문의 작성</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목 (선택)" style={inp} />
                  <textarea value={form.body} onChange={e => { setForm(f => ({ ...f, body: e.target.value })); if (sendError) setSendError('') }} placeholder="문의 내용을 입력해 주세요." rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                  {sendError && <p className="au-error" role="alert" style={{ fontSize: 12.5, color: T.danger, margin: 0, fontWeight: 500 }}>{sendError}</p>}
                  <button type="button" onClick={submitInquiry} disabled={!form.body.trim() || sending} style={{ background: form.body.trim() ? T.accent : T.surface2, color: form.body.trim() ? T.accentInk : T.ink3, border: 'none', borderRadius: 16, padding: '13px', fontSize: 14, fontWeight: 700, cursor: form.body.trim() ? 'pointer' : 'default' }}>{sending ? '접수 중...' : '문의 보내기'}</button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loaded && uid && inquiries.length === 0 && <p style={{ fontSize: 14, color: T.ink2, textAlign: 'center', padding: '20px 0' }}>접수한 문의가 없어요.</p>}
              {inquiries.map(q => (
                <div key={q.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, background: T.surface2, borderRadius: 100, padding: '2px 9px', color: T.ink2 }}>{q.category || '문의'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: q.status === 'answered' ? T.ok : T.butterInk }}>{q.status === 'answered' ? '답변완료' : '답변대기'}</span>
                  </div>
                  {q.title && <p style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{q.title}</p>}
                  <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, marginTop: 4, whiteSpace: 'pre-wrap' }}>{q.body}</p>
                  {q.answer && (
                    <div style={{ marginTop: 10, background: 'rgba(63,82,56,0.07)', borderRadius: 12, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, color: T.ok, fontWeight: 700, marginBottom: 4 }}>답변</p>
                      <p style={{ fontSize: 13, color: T.ink2, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['1. 캠페인 신청', '홈에서 원하는 캠페인을 골라 신청해요. 배송지와 (선택)제품 옵션을 입력하면 신청이 접수돼요.'],
              ['2. 선정 안내', '내부 검토 후 선정되면 안내 메시지를 받아요. 내역 탭에서 진행 상태(섭외/대기/진행/미진행)를 확인할 수 있어요.'],
              ['3. 제품 수령 & 촬영', '제품을 받으면 캠페인 가이드(필수 해시태그·멘션·공동작업자)를 확인하고 콘텐츠를 제작해요.'],
              ['4. 업로드', '업로드 탭에서 게시물 링크를 등록해요. 마감일을 꼭 지켜주세요. 업로드 전 체크리스트를 확인해요.'],
              ['5. 검수 & 정산', '담당자 검수 후 인증이 완료되면, 등록한 계좌로 원천징수 3.3% 제외 후 원고료가 지급돼요.'],
            ].map(([t, d]) => (
              <div key={t} style={card}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{t}</p>
                <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {toast && <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: T.accent, color: T.accentInk, padding: '10px 18px', borderRadius: 100, fontSize: 13.5, fontWeight: 600, zIndex: 50, whiteSpace: 'nowrap' }}>{toast}</div>}
    </div>
  )
}

export default function SupportPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: T.bg }} />}><SupportInner /></Suspense>
}
