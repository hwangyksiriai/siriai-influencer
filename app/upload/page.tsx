'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

interface Application {
  id: string
  campaigns: { name: string; upload_end: string }
}

export default function UploadPage() {
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      const { data: applications } = await supabase
        .from('applications')
        .select('id, campaigns(name, upload_end)')
        .eq('influencer_id', data.session.user.id)
        .eq('status', 'in_progress')
      setApps((applications as unknown as Application[]) || [])
      if (applications?.length) setSelectedApp(applications[0].id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!link.trim() || !selectedApp) return
    setSubmitting(true)
    await supabase.from('submissions').insert([{
      application_id: selectedApp,
      link: link.trim(),
      submitted_at: new Date().toISOString(),
      verified: false,
    }])
    setSubmitting(false)
    setDone(true)
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
            <button onClick={() => { setDone(false); setLink('') }}
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
                    <option key={a.id} value={a.id}>{a.campaigns?.name}</option>
                  ))}
                </select>
              )}
            </div>

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
              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: 'rgba(33,26,51,.4)', display: 'block', marginTop: 8, textDecoration: 'underline' }}>
                어떤 링크를 입력해야 하나요?
              </a>
            </div>

            <button type="submit" disabled={!link.trim() || !selectedApp || submitting}
              style={{ width: '100%', background: link.trim() ? '#211A33' : 'rgba(33,26,51,.2)', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 700, cursor: link.trim() ? 'pointer' : 'default', marginTop: 8, transition: 'background .2s' }}>
              {submitting ? '등록 중...' : '다음'}
            </button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
