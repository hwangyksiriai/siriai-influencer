'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Faq { id: string; category: string; question: string; answer: string }
interface Notice { id: string; title: string; body: string; pinned: boolean; created_at: string }
interface Inquiry { id: string; category: string | null; title: string | null; body: string; answer: string | null; status: string; created_at: string }

const TABS = [['notice', '공지사항'], ['faq', '자주 묻는 질문'], ['inquiry', '1:1 문의'], ['guide', '이용 가이드']] as const
type TabKey = typeof TABS[number][0]
const CATS = ['정산', '콘텐츠', '일정', '제품·배송', '계정', '기타']

const card: React.CSSProperties = { background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 14, padding: '14px 16px' }
const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(33,26,51,.18)', borderRadius: 10, padding: '11px 13px', fontSize: 14, color: '#211A33', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

function SupportInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initTab = (params.get('tab') as TabKey) || 'notice'
  const [tab, setTab] = useState<TabKey>(initTab)
  const [uid, setUid] = useState('')
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [faqCat, setFaqCat] = useState('전체')
  const [form, setForm] = useState({ category: '정산', title: '', body: '' })
  const [sending, setSending] = useState(false)

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
      if (id) loadInquiries(id)
    })
  }, [])

  async function loadInquiries(id: string) {
    const { data } = await supabase.from('inquiries').select('*').eq('influencer_id', id).order('created_at', { ascending: false })
    setInquiries((data as Inquiry[]) || [])
  }

  async function submitInquiry() {
    if (!form.body.trim() || !uid) return
    setSending(true)
    await supabase.from('inquiries').insert([{ influencer_id: uid, category: form.category, title: form.title.trim() || null, body: form.body.trim(), status: 'open' }])
    setSending(false)
    setForm({ category: '정산', title: '', body: '' })
    loadInquiries(uid)
  }

  const faqCats = ['전체', ...CATS.filter(c => faqs.some(f => f.category === c))]
  const shownFaqs = faqCat === '전체' ? faqs : faqs.filter(f => f.category === faqCat)

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 40 }}>
      <div style={{ padding: '18px 20px 0', borderBottom: '1px solid rgba(33,26,51,.08)', position: 'sticky', top: 0, background: '#F3EEE2', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 20, color: '#211A33', cursor: 'pointer', padding: 0 }}>←</button>
          <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#211A33' }}>고객센터</h1>
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: 'none', border: 'none', borderBottom: tab === k ? '2px solid #211A33' : '2px solid transparent', padding: '9px 13px', fontSize: 13, fontWeight: tab === k ? 700 : 500, color: tab === k ? '#211A33' : 'rgba(33,26,51,.4)', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>{l}</button>
          ))}
        </div>
      </div>

      <main style={{ padding: '18px 20px' }}>
        {tab === 'notice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notices.length === 0 ? <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)', textAlign: 'center', padding: '40px 0' }}>공지사항이 없어요.</p> :
              notices.map(n => (
                <div key={n.id} style={card}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#211A33' }}>{n.pinned && <span style={{ color: '#e65100' }}>[필독] </span>}{n.title}</p>
                  {n.body && <p style={{ fontSize: 13, color: 'rgba(33,26,51,.72)', lineHeight: 1.6, marginTop: 6, whiteSpace: 'pre-wrap' }}>{n.body}</p>}
                  <p style={{ fontSize: 11, color: 'rgba(33,26,51,.4)', marginTop: 8 }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              ))}
          </div>
        )}

        {tab === 'faq' && (
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {faqCats.map(c => (
                <button key={c} onClick={() => setFaqCat(c)} style={{ borderRadius: 100, padding: '6px 13px', fontSize: 12, border: '1px solid rgba(33,26,51,.2)', cursor: 'pointer', background: faqCat === c ? '#211A33' : 'transparent', color: faqCat === c ? '#F3EEE2' : '#211A33' }}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shownFaqs.map(f => (
                <div key={f.id} style={card}>
                  <button onClick={() => setOpenFaq(o => o === f.id ? null : f.id)} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: 0, textAlign: 'left', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#211A33' }}><span style={{ color: '#9b8bbd', marginRight: 6 }}>Q</span>{f.question}</span>
                    <span style={{ fontSize: 16, color: 'rgba(33,26,51,.35)', transform: openFaq === f.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>⌄</span>
                  </button>
                  {openFaq === f.id && <p style={{ fontSize: 13, color: 'rgba(33,26,51,.72)', lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-wrap' }}>{f.answer}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inquiry' && (
          <div>
            {!uid ? (
              <p style={{ fontSize: 14, color: 'rgba(33,26,51,.5)', textAlign: 'center', padding: '20px 0' }}>로그인 후 이용할 수 있어요. <Link href="/login" style={{ color: '#2A6FDB' }}>로그인</Link></p>
            ) : (
              <div style={{ ...card, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#211A33', marginBottom: 10 }}>새 문의 작성</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목 (선택)" style={inp} />
                  <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="문의 내용을 입력해 주세요." rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                  <button onClick={submitInquiry} disabled={!form.body.trim() || sending} style={{ background: form.body.trim() ? '#211A33' : 'rgba(33,26,51,.2)', color: '#F3EEE2', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: form.body.trim() ? 'pointer' : 'default' }}>{sending ? '접수 중...' : '문의 보내기'}</button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {inquiries.map(q => (
                <div key={q.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, background: 'rgba(33,26,51,.08)', borderRadius: 100, padding: '2px 9px', color: 'rgba(33,26,51,.6)' }}>{q.category || '문의'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: q.status === 'answered' ? '#2e7d32' : '#e65100' }}>{q.status === 'answered' ? '답변완료' : '답변대기'}</span>
                  </div>
                  {q.title && <p style={{ fontSize: 14, fontWeight: 600, color: '#211A33' }}>{q.title}</p>}
                  <p style={{ fontSize: 13, color: 'rgba(33,26,51,.7)', lineHeight: 1.6, marginTop: 4, whiteSpace: 'pre-wrap' }}>{q.body}</p>
                  {q.answer && (
                    <div style={{ marginTop: 10, background: 'rgba(46,125,50,.06)', borderRadius: 10, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, color: '#2e7d32', fontWeight: 700, marginBottom: 4 }}>답변</p>
                      <p style={{ fontSize: 13, color: 'rgba(33,26,51,.8)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{q.answer}</p>
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
                <p style={{ fontSize: 14, fontWeight: 700, color: '#211A33', marginBottom: 4 }}>{t}</p>
                <p style={{ fontSize: 13, color: 'rgba(33,26,51,.7)', lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function SupportPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F3EEE2' }} />}><SupportInner /></Suspense>
}
