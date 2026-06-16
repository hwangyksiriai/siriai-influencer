'use client'

import React from 'react'

/* 글래스 리뉴얼(레퍼 2) 공용 프리미티브 — .glass-screen CSS 변수를 읽음 */

// 배경: 블루–바이올렛 그라데이션 + 떠다니는 발광 블롭 + 그레인
export function GlassBackground() {
  return (
    <>
      <div className="glass-blobs" aria-hidden />
      <div className="glass-blob3" aria-hidden />
      <div className="glass-grain" aria-hidden />
    </>
  )
}

// 배경: 흑백 그레인 사진(사진2) + 뉴트럴 다크 스크림 — 인증 플로우 공통
export function GlassPhotoBackground({ src = '/brand/auth.png', position = 'center 22%' }: { src?: string; position?: string }) {
  return (
    <>
      <img src={src} alt="" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, zIndex: 0 }} />
      {/* 가독성용 다크 스크림 (상단 살짝, 하단 진하게) */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(12,11,16,0.38) 0%, rgba(12,11,16,0.36) 34%, rgba(9,8,13,0.72) 74%, rgba(7,6,10,0.93) 100%)' }} />
      {/* 브랜드 톤 살짝 (상단 코너 글로우) */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(120% 78% at 16% 4%, rgba(132,122,255,0.16), transparent 56%)', mixBlendMode: 'screen' }} />
    </>
  )
}

// 둥근 글래스 아이콘 버튼 (뒤로/벨 등)
export function GlassIconButton({ children, onClick, size = 44, ariaLabel, badge, style }: {
  children: React.ReactNode; onClick?: () => void; size?: number; ariaLabel?: string; badge?: boolean; style?: React.CSSProperties
}) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="glass-btn"
      style={{
        position: 'relative', width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'var(--g-tint-2)', border: '1px solid var(--g-border)',
        backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        color: 'var(--g-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 16px rgba(0,0,0,0.18)', ...style,
      }}>
      {children}
      {badge && <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: '50%', background: 'var(--g-accent)', boxShadow: '0 0 0 2px rgba(0,0,0,0.12)' }} />}
    </button>
  )
}

// 프라이머리 / 글래스 버튼
export function GlassButton({ children, onClick, type = 'button', variant = 'primary', disabled, loading, icon, style }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; variant?: 'primary' | 'glass'
  disabled?: boolean; loading?: boolean; icon?: React.ReactNode; style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    width: '100%', height: 54, borderRadius: 16, border: 'none',
    fontFamily: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap',
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, position: 'relative', overflow: 'hidden',
  }
  const skins: Record<string, React.CSSProperties> = {
    primary: {
      background: '#ffffff', color: 'var(--g-accent-ink)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.6)',
    },
    glass: {
      background: 'var(--g-tint-2)', color: 'var(--g-text)',
      backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      border: '1px solid var(--g-border)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
    },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="glass-btn" style={{ ...base, ...skins[variant], ...style }}>
      {loading && <span className="glass-spinner" aria-hidden />}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9 }}>{children}{icon}</span>
    </button>
  )
}

// 라벨 글래스 입력 — 포커스 링 포함
export function GlassInput({ label, htmlFor, trailing, hint, hintError, ...props }: {
  label: string; htmlFor: string; trailing?: React.ReactNode; hint?: string; hintError?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {label && <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--g-text-dim)', margin: '0 0 7px 4px', letterSpacing: '-0.01em' }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center', height: 52, padding: '0 8px 0 16px', borderRadius: 14,
        background: 'var(--g-field)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--g-border-soft)',
      }}>
        <input id={htmlFor} className="glass-input" {...props}
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }} />
        {trailing}
      </div>
      {hint && <p style={{ fontSize: 12, color: hintError ? '#FFC4BB' : 'var(--g-text-faint)', margin: '6px 2px 0', fontWeight: 500 }}>{hint}</p>}
    </div>
  )
}

// 에러 박스
export function GlassError({ children }: { children: React.ReactNode }) {
  return (
    <div className="au-error" role="alert" style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      background: 'rgba(255,90,80,0.18)', border: '1px solid rgba(255,120,110,0.42)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 12, padding: '11px 13px',
    }}>
      <span style={{ fontSize: 13, lineHeight: '19px' }}>⚠️</span>
      <p style={{ fontSize: 13, color: '#FFD3CD', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{children}</p>
    </div>
  )
}

// 비밀번호 보기 토글
export function PwToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={show}
      style={{ background: 'none', border: 'none', color: 'var(--g-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, flexShrink: 0 }}>
      {show ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.6 4.1M6.3 7.8A17.2 17.2 0 0 0 2 12s3.5 6 10 6a10.7 10.7 0 0 0 3.6-.6M9.5 9.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  )
}
