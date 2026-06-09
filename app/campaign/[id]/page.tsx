'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Ico } from '@/components/ui'
import { T, PHOTO, CAT, catKey, won, campaignImg } from '@/lib/theme'

interface Campaign {
  id: string
  name: string
  fee: string
  fee_amount: number
  product_value: number
  app_hidden: boolean
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

const sec: React.CSSProperties = { padding: '22px 20px', borderTop: `8px solid ${T.wash}` }
const lbl: React.CSSProperties = { fontFamily: T.fontUI, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: T.ink3, marginBottom: 10, fontWeight: 600 }
const infoRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${T.line}` }

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
      // 숨긴 캠페인(app_hidden)은 인플루언서가 직접 접근해도 볼 수 없게 차단
      if (data && (data as Campaign).app_hidden) { router.replace('/home'); return }
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
    const daum = (window as unknown as { daum?: { Postcode?: new (o: object) => { open: () => void } } }).daum
    if (!daum || !daum.Postcode) { alert('주소 검색을 불러오는 중이에요. 잠시 후 다시 시도해 주세요.'); return }
    new daum.Postcode({ oncomplete: (d: { roadAddress?: string; jibunAddress?: string; address?: string }) => setAddress(d.roadAddress || d.jibunAddress || d.address || '') }).open()
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

  if (loading) return <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: T.ink3 }}>불러오는 중...</p></div>
  if (!campaign) return null

  const k = catKey(campaign.category)
  const [catLabel, catBg, catInk] = CAT[k] || CAT.default
  const mono = (campaign.brands?.name || '?').charAt(0)
  const reward = campaign.fee_amount || campaign.product_value || 0

  const products = (campaign.products && campaign.products.length)
    ? campaign.products
    : (campaign.product_name ? [{ name: campaign.product_name, link: campaign.product_link, photo_url: campaign.product_photo_url }] : [])
  const collabs: string[] = (campaign.collab_handles && campaign.collab_handles.length)
    ? campaign.collab_handles
    : (campaign.collab_handle ? [campaign.collab_handle] : [])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontUI, color: T.ink, paddingBottom: 110 }}>
      {/* 헤더 */}
      <div style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 10, borderBottom: `1px solid ${T.line}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.back()} aria-label="뒤로" style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico.back width="20" height="20" />
        </button>
      </div>

      {/* 히어로 */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: PHOTO[k] || PHOTO.default }}>
        <img src={campaignImg(campaign.id, campaign.image_url || campaign.product_photo_url || products[0]?.photo_url)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.04) 70%, rgba(0,0,0,0.12))' }} />
      </div>

      {/* 기본 정보 */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: catBg, color: catInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 16 }}>{mono}</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.ink2 }}>{campaign.brands?.name}</span>
          <span style={{ marginLeft: 'auto', padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: catBg, color: catInk }}>{catLabel}</span>
        </div>
        <h1 style={{ fontFamily: T.fontUI, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, color: T.ink, marginBottom: 12 }}>{campaign.name}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <span style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 28, color: T.ink, letterSpacing: '-0.02em' }}>{reward ? `₩${won(reward)}` : (campaign.fee || '협의')}</span>
          {campaign.product_value ? <span style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>+ 제품 {won(campaign.product_value)}원 상당</span> : null}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ border: `1px solid ${T.line}`, borderRadius: 999, padding: '5px 12px', fontSize: 12, color: T.ink2, fontWeight: 600 }}>{campaign.content_type}</span>
          {campaign.collab_required && <span style={{ background: T.lav, color: T.lavInk, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>공동작업 필수</span>}
          {campaign.second_use_required && <span style={{ background: T.blush, color: T.blushInk, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>2차활용 필수</span>}
        </div>
      </div>

      {/* 브랜드 설명 */}
      {campaign.brand_description && (
        <div style={sec}>
          <p style={lbl}>브랜드 소개</p>
          <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.7 }}>{campaign.brand_description}</p>
        </div>
      )}

      {/* 캠페인 개요 */}
      <div style={sec}>
        <p style={lbl}>캠페인 개요</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={infoRow}>
            <span style={{ fontSize: 13, color: T.ink2 }}>콘텐츠 형식</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{campaign.content_type}{campaign.content_duration ? ` (${campaign.content_duration}초 이상)` : ''}{campaign.content_count ? ` (${campaign.content_count}장 이상)` : ''}</span>
          </div>
          {(campaign.fee_amount || campaign.fee) && (
            <div style={infoRow}>
              <span style={{ fontSize: 13, color: T.ink2 }}>고료</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{campaign.fee_amount ? `₩${won(campaign.fee_amount)}` : campaign.fee}</span>
            </div>
          )}
          {campaign.upload_start && (
            <div style={infoRow}>
              <span style={{ fontSize: 13, color: T.ink2 }}>업로드 기간</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{campaign.upload_start} ~ {campaign.upload_end}</span>
            </div>
          )}
        </div>
      </div>

      {/* 타임라인 */}
      {(campaign.timeline_apply_end || campaign.timeline_selection_date || campaign.timeline_shipping_date) && (
        <div style={sec}>
          <p style={lbl}>타임라인</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {campaign.timeline_apply_end && <div style={infoRow}><span style={{ fontSize: 13, color: T.ink2 }}>신청 마감</span><span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{campaign.timeline_apply_end}</span></div>}
            {campaign.timeline_selection_date && <div style={infoRow}><span style={{ fontSize: 13, color: T.ink2 }}>선정자 발표</span><span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{campaign.timeline_selection_date}</span></div>}
            {campaign.timeline_shipping_date && <div style={infoRow}><span style={{ fontSize: 13, color: T.ink2 }}>제품 발송</span><span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{campaign.timeline_shipping_date}</span></div>}
            {campaign.upload_start && <div style={{ ...infoRow, borderBottom: 'none' }}><span style={{ fontSize: 13, color: T.ink2 }}>콘텐츠 업로드</span><span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{campaign.upload_start} ~ {campaign.upload_end}</span></div>}
          </div>
          <p style={{ fontSize: 11, color: T.ink3, marginTop: 10, lineHeight: 1.5 }}>ⓘ 타임라인은 캠페인 진행 상황에 따라 조금씩 변동될 수 있어요.</p>
        </div>
      )}

      {/* 제품 정보 */}
      {products.length > 0 && (
        <div style={sec}>
          <p style={lbl}>제공 제품</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map((p, i) => (
              <div key={i} style={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                {p.photo_url && <img src={p.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>{p.name}</p>
                  {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: T.lavInk, textDecoration: 'none' }}>제품 링크 보기 ↗</a>}
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
              style={{ display: 'block', background: T.lav, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: '12px 14px', fontSize: 13, color: T.lavInk, fontWeight: 600, textDecoration: 'none', marginBottom: 12 }}>
              📎 가이드 파일 보기 ↗
            </a>
          )}
          {campaign.guide_must && (
            <div style={{ background: T.surface2, borderRadius: T.radiusSm, padding: '12px 14px', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.ink, marginBottom: 6 }}>✅ 필수 사항</p>
              <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.guide_must}</p>
            </div>
          )}
          {campaign.guide_forbidden && (
            <div style={{ background: 'rgba(176,71,59,0.07)', borderRadius: T.radiusSm, padding: '12px 14px', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.danger, marginBottom: 6 }}>🚫 금지 사항</p>
              <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.guide_forbidden}</p>
            </div>
          )}
          {campaign.guide_recommended && (
            <div style={{ background: 'rgba(73,65,115,0.06)', borderRadius: T.radiusSm, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.lavInk, marginBottom: 6 }}>💡 추천 사항</p>
              <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.guide_recommended}</p>
            </div>
          )}
        </div>
      )}

      {/* 업로드 가이드 */}
      {(collabs.length > 0 || campaign.caption_must || campaign.hashtags) && (
        <div style={sec}>
          <p style={lbl}>업로드 가이드</p>
          {collabs.map((h, i) => (
            <div key={i} style={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: T.ink3, marginBottom: 4 }}>공동작업자 계정{collabs.length > 1 ? ` ${i + 1}` : ''}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{h}</p>
              </div>
              <button onClick={() => copy(h, 'collab' + i)}
                style={{ background: copied === 'collab' + i ? T.accent : T.surface, color: copied === 'collab' + i ? T.accentInk : T.ink, border: `1px solid ${T.line}`, borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                {copied === 'collab' + i ? '복사됨 ✓' : '복사'}
              </button>
            </div>
          ))}
          {campaign.caption_must && (
            <div style={{ background: T.surface2, borderRadius: T.radiusSm, padding: '12px 14px', marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.ink, marginBottom: 6 }}>✅ 캡션 필수 사항</p>
              <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{campaign.caption_must}</p>
            </div>
          )}
          {campaign.hashtags && (
            <div style={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, marginRight: 10 }}>
                <p style={{ fontSize: 11, color: T.ink3, marginBottom: 4 }}>필수 해시태그</p>
                <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>{campaign.hashtags}</p>
              </div>
              <button onClick={() => copy(campaign.hashtags, 'hash')}
                style={{ background: copied === 'hash' ? T.accent : T.surface, color: copied === 'hash' ? T.accentInk : T.ink, border: `1px solid ${T.line}`, borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
                {copied === 'hash' ? '복사됨 ✓' : '복사'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 신청 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: T.surface, borderTop: `1px solid ${T.line}`, padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <button onClick={() => !alreadyApplied && setShowApply(true)} disabled={alreadyApplied}
          style={{ width: '100%', background: alreadyApplied ? T.surface2 : T.accent, color: alreadyApplied ? T.ink3 : T.accentInk, border: 'none', borderRadius: 16, padding: '15px', fontSize: 15, fontWeight: 700, cursor: alreadyApplied ? 'default' : 'pointer' }}>
          {alreadyApplied ? '신청 완료' : '캠페인 지원하기'}
        </button>
      </div>

      {/* 신청 모달 */}
      {showApply && (
        <div onClick={() => setShowApply(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: '26px 26px 0 0', padding: '24px 20px 32px', width: '100%' }}>
            <div style={{ width: 40, height: 4, background: T.line, borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 500, marginBottom: 20, letterSpacing: '-0.02em' }}>캠페인 지원</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="주소 검색을 눌러주세요" value={address} readOnly onClick={openPostcode}
                  style={{ flex: 1, border: `1px solid ${T.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: T.surface2, cursor: 'pointer', color: T.ink }} />
                <button type="button" onClick={openPostcode}
                  style={{ flexShrink: 0, background: T.accent, color: T.accentInk, border: 'none', borderRadius: 12, padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>주소 검색</button>
              </div>
              <input placeholder="상세 주소 (동, 호수 등)" value={addressDetail} onChange={e => setAddressDetail(e.target.value)}
                style={{ width: '100%', border: `1px solid ${T.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: T.ink }} />
              <input placeholder="요청사항 (선택)" value={request} onChange={e => setRequest(e.target.value)}
                style={{ width: '100%', border: `1px solid ${T.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: T.ink }} />
              <div style={{ background: 'rgba(176,71,59,0.07)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: T.danger, lineHeight: 1.5 }}>
                ⚠️ 배송지는 매 캠페인마다 새로 확인합니다. 정확히 입력해 주세요.
              </div>
              <div style={{ background: T.surface2, borderRadius: 12, padding: '12px 14px', fontSize: 12, color: T.ink2, lineHeight: 1.6 }}>
                📌 <b style={{ color: T.ink }}>업로드·정산 안내</b><br />
                · {campaign?.upload_end ? `업로드 마감(${new Date(campaign.upload_end).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })})` : '안내된 업로드 마감일'}까지 미업로드 시 <b style={{ color: T.ink }}>정산이 불가</b>합니다.<br />
                · 정산은 <b style={{ color: T.ink }}>매월 5일</b> 일괄 지급됩니다.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: T.ink, lineHeight: 1.5, cursor: 'pointer', padding: '4px 2px' }}>
                <input type="checkbox" checked={costAgree} onChange={e => setCostAgree(e.target.checked)} style={{ width: 18, height: 18, accentColor: T.accent, flexShrink: 0, marginTop: 1 }} />
                <span>선정 후 <b>미업로드 시 제공받은 제품의 원가를 청구</b>받는 데 동의합니다. <span style={{ color: T.danger }}>(필수)</span></span>
              </label>
              <button onClick={handleApply} disabled={applying || !address.trim() || !costAgree}
                style={{ width: '100%', background: T.accent, color: T.accentInk, border: 'none', borderRadius: 16, padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (applying || !costAgree || !address.trim()) ? .5 : 1 }}>
                {applying ? '신청 중...' : !costAgree ? '동의 후 신청 가능' : '신청 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신청 완료 안내 */}
      {applySuccess && (
        <div onClick={() => setApplySuccess(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: 24, padding: '32px 24px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>🎉</p>
            <h3 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 8, letterSpacing: '-0.02em' }}>신청 완료!</h3>
            <p style={{ fontSize: 14, color: T.ink2, lineHeight: 1.6, marginBottom: 24 }}>캠페인 신청이 접수됐어요.<br />선정 결과를 기다려 주세요.</p>
            <button onClick={() => setApplySuccess(false)}
              style={{ width: '100%', background: T.accent, color: T.accentInk, border: 'none', borderRadius: 16, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>확인</button>
          </div>
        </div>
      )}
    </div>
  )
}
