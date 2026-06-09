'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  fee: string
  fee_amount: number
  product_value: number
  image_url: string
  content_type: string
  content_duration: number
  content_count: number
  upload_start: string
  upload_end: string
  collab_required: boolean
  second_use_required: boolean
  collab_handle: string
  collab_handles: string[]
  category: string
  hashtags: string
  brand_description: string
  product_name: string
  product_link: string
  product_photo_url: string
  products: { name: string; link: string; photo_url: string }[]
  guide_must: string
  guide_forbidden: string
  guide_recommended: string
  guide_file_url: string
  caption_must: string
  caption_forbidden: string
  caption_recommended: string
  timeline_apply_end: string
  timeline_selection_date: string
  timeline_shipping_date: string
  brands: { name: string }
}

const sec = { padding: '20px 20px', borderTop: '8px solid rgba(33,26,51,.05)' }
const lbl: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(33,26,51,.4)', marginBottom: 8 }
const infoRow = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(33,26,51,.07)' }

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [request, setRequest] = useState('')
  const [costAgree, setCostAgree] = useState(false)
  const [userId, setUserId] = useState('')
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    supabase.from('campaigns').select('*, brands(name)').eq('id', id).single().then(({ data }) => {
      setCampaign(data as Campaign)
      setLoading(false)
    })
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      setUserId(data.session.user.id)
      const { data: app } = await supabase.from('applications').select('id').eq('campaign_id', id).eq('influencer_id', data.session.user.id).maybeSingle()
      if (app) setAlreadyApplied(true)
    })
  }, [id])

  useEffect(() => {
    if (document.getElementById('daum-postcode-script')) return
    const s = document.createElement('script')
    s.id = 'daum-postcode-script'
    s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    document.body.appendChild(s)
  }, [])

  function openPostcode() {
    const daum = (window as any).daum
    if (!daum || !daum.Postcode) { alert('주소 검색을 불러오는 중이에요. 잠시 후 다시 시도해 주세요.'); return }
    new daum.Postcode({ oncomplete: (d: any) => setAddress(d.roadAddress || d.jibunAddress || d.address || '') }).open()
  }

  async function handleApply() {
    if (!address.trim()) return
    setApplying(true)
    await supabase.from('applications').insert([{
      campaign_id: id,
      influencer_id: userId,
      address, address_detail: addressDetail, request,
      cost_agreement: costAgree,
      status: 'pending',
    }])
    // 프로필 주소 자동 갱신 (가장 최근 신청 주소로)
    const fullAddr = `${address}${addressDetail ? ' ' + addressDetail : ''}`.trim()
    if (fullAddr) await supabase.from('influencers').update({ address: fullAddr }).eq('id', userId)
    setApplying(false)
    setShowApply(false)
    setAlreadyApplied(true)
    setApplySuccess(true)
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#F3EEE2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'rgba(33,26,51,.4)' }}>불러오는 중...</p></div>
  if (!campaign) return null

  // 여러 제품 / 여러 공동작업자 (구버전 단일 필드는 폴백으로 지원)
  const products = (campaign.products && campaign.products.length)
    ? campaign.products
    : (campaign.product_name ? [{ name: campaign.product_name, link: campaign.product_link, photo_url: campaign.product_photo_url }] : [])
  const collabs: string[] = (campaign.collab_handles && campaign.collab_handles.length)
    ? campaign.collab_handles
    : (campaign.collab_handle ? [campaign.collab_handle] : [])

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', paddingBottom: 100 }}>
      {/* 헤더 */}
      <div style={{ position: 'sticky', top: 0, background: '#F3EEE2', zIndex: 10, borderBottom: '1px solid rgba(33,26,51,.1)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#211A33" strokeWidth={2.5}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
      </div>

      {/* 히어로 */}
      <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg, #f0ece2, #e8e4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(campaign.image_url || campaign.product_photo_url || products[0]?.photo_url)
          ? <img src={campaign.image_url || campaign.product_photo_url || products[0].photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: "'Helvetica Neue',sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: '.1em', color: 'rgba(33,26,51,.35)', textTransform: 'uppercase' }}>{campaign.brands?.name}</span>
        }
      </div>

      {/* 기본 정보 */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(33,26,51,.4)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>{campaign.brands?.name}</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.25, color: '#211A33', marginBottom: 8 }}>{campaign.name}</h1>
        {(campaign.product_value || campaign.fee) && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(33,26,51,.7)', marginBottom: 12 }}>
            🎁 <span style={{ fontWeight: 600 }}>{campaign.product_value ? `${campaign.product_value.toLocaleString()}원 상당` : campaign.fee}</span>
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ border: '1px solid rgba(33,26,51,.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'rgba(33,26,51,.6)' }}>{campaign.content_type}</span>
          {campaign.collab_required && <span style={{ background: '#2A6FDB', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>공동작업 필수</span>}
          {campaign.second_use_required && <span style={{ background: '#e65100', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>2차활용 필수</span>}
        </div>
      </div>

      {/* 브랜드 설명 */}
      {campaign.brand_description && (
        <div style={sec}>
          <p style={lbl}>브랜드 소개</p>
          <p style={{ fontSize: 14, color: 'rgba(33,26,51,.7)', lineHeight: 1.6 }}>{campaign.brand_description}</p>
        </div>
      )}

      {/* 캠페인 개요 */}
      <div style={sec}>
        <p style={lbl}>캠페인 개요</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={infoRow}>
            <span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>콘텐츠 형식</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#211A33' }}>{campaign.content_type}{campaign.content_duration ? ` (${campaign.content_duration}초 이상)` : ''}{campaign.content_count ? ` (${campaign.content_count}장 이상)` : ''}</span>
          </div>
          {(campaign.fee_amount || campaign.fee) && (
            <div style={infoRow}>
              <span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>고료</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e65100' }}>{campaign.fee_amount ? `${campaign.fee_amount.toLocaleString()}원` : campaign.fee}</span>
            </div>
          )}
          {campaign.upload_start && (
            <div style={infoRow}>
              <span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>업로드 기간</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e03' }}>{campaign.upload_start} ~ {campaign.upload_end}</span>
            </div>
          )}
        </div>
      </div>

      {/* 타임라인 */}
      {(campaign.timeline_apply_end || campaign.timeline_selection_date || campaign.timeline_shipping_date) && (
        <div style={sec}>
          <p style={lbl}>타임라인</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {campaign.timeline_apply_end && <div style={infoRow}><span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>신청 마감</span><span style={{ fontSize: 13, fontWeight: 600, color: '#211A33' }}>{campaign.timeline_apply_end}</span></div>}
            {campaign.timeline_selection_date && <div style={infoRow}><span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>선정자 발표</span><span style={{ fontSize: 13, fontWeight: 600, color: '#211A33' }}>{campaign.timeline_selection_date}</span></div>}
            {campaign.timeline_shipping_date && <div style={infoRow}><span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>제품 발송</span><span style={{ fontSize: 13, fontWeight: 600, color: '#211A33' }}>{campaign.timeline_shipping_date}</span></div>}
            {campaign.upload_start && <div style={{ ...infoRow, borderBottom: 'none' }}><span style={{ fontSize: 13, color: 'rgba(33,26,51,.5)' }}>콘텐츠 업로드</span><span style={{ fontSize: 13, fontWeight: 600, color: '#211A33' }}>{campaign.upload_start} ~ {campaign.upload_end}</span></div>}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(33,26,51,.45)', marginTop: 10, lineHeight: 1.5 }}>ⓘ 타임라인은 캠페인 진행 상황에 따라 조금씩 변동될 수 있어요.</p>
        </div>
      )}

      {/* 제품 정보 */}
      {products.length > 0 && (
        <div style={sec}>
          <p style={lbl}>제공 제품</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map((p, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 12, padding: '14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                {p.photo_url && <img src={p.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#211A33', marginBottom: 4 }}>{p.name}</p>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2A6FDB', textDecoration: 'none' }}>제품 링크 보기 ↗</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 콘텐츠 제작 가이드 */}
      {(campaign.guide_must || campaign.guide_forbidden || campaign.guide_recommended || campaign.guide_file_url) && (
        <div style={sec}>
          <p style={lbl}>콘텐츠 제작 가이드</p>
          {campaign.guide_file_url && (
            <a href={campaign.guide_file_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', background: 'rgba(42,111,219,.1)', border: '1px solid rgba(42,111,219,.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#2A6FDB', textDecoration: 'none', marginBottom: 12 }}>
              📎 가이드 파일 보기 ↗
            </a>
          )}
          {campaign.guide_must && (
            <div style={{ background: 'rgba(33,26,51,.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#211A33', marginBottom: 6 }}>✅ 필수 사항</p>
              <p style={{ fontSize: 13, color: 'rgba(33,26,51,.7)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.guide_must}</p>
            </div>
          )}
          {campaign.guide_forbidden && (
            <div style={{ background: 'rgba(224,0,51,.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#e03', marginBottom: 6 }}>🚫 금지 사항</p>
              <p style={{ fontSize: 13, color: 'rgba(33,26,51,.7)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.guide_forbidden}</p>
            </div>
          )}
          {campaign.guide_recommended && (
            <div style={{ background: 'rgba(42,111,219,.05)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2A6FDB', marginBottom: 6 }}>💡 추천 사항</p>
              <p style={{ fontSize: 13, color: 'rgba(33,26,51,.7)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.guide_recommended}</p>
            </div>
          )}
        </div>
      )}

      {/* 업로드 가이드 */}
      {(collabs.length > 0 || campaign.caption_must || campaign.hashtags) && (
        <div style={sec}>
          <p style={lbl}>업로드 가이드</p>
          {collabs.map((h, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 10, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(33,26,51,.4)', marginBottom: 4 }}>공동작업자 계정{collabs.length > 1 ? ` ${i + 1}` : ''}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#211A33' }}>{h}</p>
              </div>
              <button onClick={() => copy(h, 'collab' + i)}
                style={{ background: copied === 'collab' + i ? '#211A33' : 'rgba(33,26,51,.08)', color: copied === 'collab' + i ? '#F3EEE2' : '#211A33', border: 'none', borderRadius: 100, padding: '7px 14px', fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
                {copied === 'collab' + i ? '복사됨 ✓' : '복사'}
              </button>
            </div>
          ))}
          {campaign.caption_must && (
            <div style={{ background: 'rgba(33,26,51,.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#211A33', marginBottom: 6 }}>✅ 캡션 필수 사항</p>
              <p style={{ fontSize: 13, color: 'rgba(33,26,51,.7)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.caption_must}</p>
            </div>
          )}
          {campaign.hashtags && (
            <div style={{ background: 'rgba(255,255,255,.6)', border: '1px solid rgba(33,26,51,.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, marginRight: 10 }}>
                <p style={{ fontSize: 11, color: 'rgba(33,26,51,.4)', marginBottom: 4 }}>필수 해시태그</p>
                <p style={{ fontSize: 13, color: '#211A33', lineHeight: 1.5 }}>{campaign.hashtags}</p>
              </div>
              <button onClick={() => copy(campaign.hashtags, 'hash')}
                style={{ background: copied === 'hash' ? '#211A33' : 'rgba(33,26,51,.08)', color: copied === 'hash' ? '#F3EEE2' : '#211A33', border: 'none', borderRadius: 100, padding: '7px 14px', fontSize: 12, cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
                {copied === 'hash' ? '복사됨 ✓' : '복사'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 신청 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#F3EEE2', borderTop: '1px solid rgba(33,26,51,.1)', padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        {(campaign.fee_amount || campaign.fee) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(33,26,51,.45)' }}>고료</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#e65100' }}>💵 {campaign.fee_amount ? `${campaign.fee_amount.toLocaleString()}원` : campaign.fee}</span>
          </div>
        )}
        <button onClick={() => !alreadyApplied && setShowApply(true)} disabled={alreadyApplied}
          style={{ width: '100%', background: alreadyApplied ? 'rgba(33,26,51,.2)' : '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 700, cursor: alreadyApplied ? 'default' : 'pointer' }}>
          {alreadyApplied ? '신청 완료' : '캠페인 신청하기'}
        </button>
      </div>

      {/* 신청 모달 */}
      {showApply && (
        <div onClick={() => setShowApply(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%' }}>
            <div style={{ width: 40, height: 4, background: 'rgba(33,26,51,.2)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.5px' }}>캠페인 신청</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="주소 검색을 눌러주세요" value={address} readOnly onClick={openPostcode}
                  style={{ flex: 1, border: '1.5px solid rgba(33,26,51,.2)', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: 'rgba(33,26,51,.03)', cursor: 'pointer' }} />
                <button type="button" onClick={openPostcode}
                  style={{ flexShrink: 0, background: '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>주소 검색</button>
              </div>
              <input placeholder="상세 주소 (동, 호수 등)" value={addressDetail} onChange={e => setAddressDetail(e.target.value)}
                style={{ width: '100%', border: '1.5px solid rgba(33,26,51,.2)', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <input placeholder="요청사항 (선택)" value={request} onChange={e => setRequest(e.target.value)}
                style={{ width: '100%', border: '1.5px solid rgba(33,26,51,.2)', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ background: '#fff5f5', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#e03', lineHeight: 1.5 }}>
                ⚠️ 배송지는 매 캠페인마다 새로 확인합니다. 정확히 입력해 주세요.
              </div>
              <div style={{ background: 'rgba(33,26,51,.04)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'rgba(33,26,51,.7)', lineHeight: 1.6 }}>
                📌 <b>업로드·정산 안내</b><br />
                · {campaign?.upload_end ? `업로드 마감(${new Date(campaign.upload_end).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })})` : '안내된 업로드 마감일'}까지 미업로드 시 <b>정산이 불가</b>합니다.<br />
                · 정산은 <b>매월 5일</b> 일괄 지급됩니다.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#211A33', lineHeight: 1.5, cursor: 'pointer', padding: '4px 2px' }}>
                <input type="checkbox" checked={costAgree} onChange={e => setCostAgree(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#211A33', flexShrink: 0, marginTop: 1 }} />
                <span>선정 후 <b>미업로드 시 제공받은 제품의 원가를 청구</b>받는 데 동의합니다. <span style={{ color: '#e03' }}>(필수)</span></span>
              </label>
              <button onClick={handleApply} disabled={applying || !address.trim() || !costAgree}
                style={{ width: '100%', background: '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (applying || !costAgree) ? .5 : 1 }}>
                {applying ? '신청 중...' : !costAgree ? '동의 후 신청 가능' : '신청 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신청 완료 안내 */}
      {applySuccess && (
        <div onClick={() => setApplySuccess(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: '32px 24px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>🎉</p>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#211A33', marginBottom: 8, letterSpacing: '-0.5px' }}>신청 완료!</h3>
            <p style={{ fontSize: 14, color: 'rgba(33,26,51,.6)', lineHeight: 1.6, marginBottom: 24 }}>캠페인 신청이 접수됐어요.<br />선정 결과를 기다려 주세요.</p>
            <button onClick={() => setApplySuccess(false)}
              style={{ width: '100%', background: '#211A33', color: '#F3EEE2', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>확인</button>
          </div>
        </div>
      )}
    </div>
  )
}
