'use client'

import React from 'react'
import { T, CAT, PHOTO } from '@/lib/theme'

/* ── 아이콘 (라인 스타일) ──────────────────────────────────────── */
type IcoProps = React.SVGProps<SVGSVGElement>
export const Ico = {
  search:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  chat:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 12.5C4 8.4 7.6 5.5 12 5.5s8 2.9 8 7-3.6 7-8 7c-1 0-2-.1-2.9-.4L5 20.5l1-3.2A6.6 6.6 0 0 1 4 12.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  bell:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 17V11a6 6 0 1 1 12 0v6M4.5 17h15M10 20.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  camera:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 8.5h3l1.3-2.2a1 1 0 0 1 .9-.5h5.6a1 1 0 0 1 .9.5L17 8.5h3a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  home:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 11.5 12 4l8 7.5M6 10v9.5a.5.5 0 0 0 .5.5H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a.5.5 0 0 0 .5-.5V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendar:(p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  plus:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  upload:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5M5 18.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  doc:     (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 3.5h7.5L19 9v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 3.5V9h5.5M8.5 13h7M8.5 16.5h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/><path d="M5.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  back:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  filter:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  pin:     (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.6"/></svg>,
  chevR:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevD:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevron: (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4.3l2.8 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  image:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.4"/><path d="M5 17l4.5-4 3 2.5L16 12l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  won:     (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 7l2.6 10L9 9l3 8 3-8 2.4 8L20 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  heart:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7-2.7c0 4.9-7 9.7-7 9.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  gear:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  spark:   (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3c.6 4.4 1.6 5.4 6 6-4.4.6-5.4 1.6-6 6-.6-4.4-1.6-5.4-6-6 4.4-.6 5.4-1.6 6-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
}

/* ── 프리미티브 ───────────────────────────────────────────────── */
export function Pill({ children, bg, ink, size = 11 }: { children: React.ReactNode; bg: string; ink: string; size?: number }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999, fontFamily: T.fontUI, fontSize: size, fontWeight: 600, letterSpacing: '-0.01em', background: bg, color: ink, whiteSpace: 'nowrap' }}>{children}</span>
}

export function Card({ children, style, pad = true, onClick }: { children: React.ReactNode; style?: React.CSSProperties; pad?: boolean; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.line}`, boxShadow: '0 1px 2px rgba(20,20,20,0.03)', padding: pad ? T.cardPad : 0, boxSizing: 'border-box', ...style }}>{children}</div>
}

export function Monogram({ letter, cat = 'beauty', size = 46, radius = 14 }: { letter: React.ReactNode; cat?: string; size?: number; radius?: number }) {
  const [, bg, ink] = CAT[cat] || CAT.default
  return <div style={{ width: size, height: size, borderRadius: radius, background: bg, color: ink, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontDisplay, fontWeight: 600, fontSize: size * 0.46, letterSpacing: '-0.02em' }}>{letter}</div>
}

export function Avatar({ emoji, size = 46, tint = T.blush, ring }: { emoji: React.ReactNode; size?: number; tint?: string; ring?: boolean }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, overflow: 'hidden', boxShadow: ring ? `0 0 0 3px ${T.surface}, 0 0 0 4.5px ${T.line}` : 'none' }}>{emoji}</div>
}

export function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} style={{ padding: '7px 13px', borderRadius: 999, whiteSpace: 'nowrap', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', cursor: onClick ? 'pointer' : 'default', background: active ? T.accent : T.surface2, color: active ? T.accentInk : T.ink2, border: active ? 'none' : `1px solid ${T.line}`, flexShrink: 0 }}>{children}</button>
}

/* 카테고리별 추상 포토 블록 — 실사진 쓰려면 background 를 url(...) 로 교체 */
export function PhotoBlock({ cat = 'beauty', monogram, style, children, radius = T.radiusSm, imageUrl }: { cat?: string; monogram?: React.ReactNode; style?: React.CSSProperties; children?: React.ReactNode; radius?: number; imageUrl?: string }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, background: PHOTO[cat] || PHOTO.default, ...style }}>
      {imageUrl && <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      {monogram && !imageUrl && <span style={{ position: 'absolute', right: 14, bottom: 8, fontFamily: T.fontDisplay, fontSize: 54, fontWeight: 600, color: 'rgba(255,255,255,0.32)', letterSpacing: '-0.03em', lineHeight: 1 }}>{monogram}</span>}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.06) 70%, rgba(0,0,0,0.14))' }} />
      <div style={{ position: 'relative', height: '100%' }}>{children}</div>
    </div>
  )
}

export function IconBtn({ icon: I, badge, onClick, ariaLabel }: { icon: (p: IcoProps) => React.ReactElement; badge?: boolean; onClick?: () => void; ariaLabel?: string }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} style={{ width: 44, height: 44, borderRadius: 14, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <I width="22" height="22" />
      {badge && <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 999, background: T.blushInk, border: `2px solid ${T.surface}` }} />}
    </button>
  )
}

export function AppHeader({ kicker, title, right }: { kicker?: React.ReactNode; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ padding: `0 ${T.pad}px`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        {kicker && <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink3, letterSpacing: '0.02em', marginBottom: 6 }}>{kicker}</div>}
        <h1 style={{ margin: 0, fontFamily: T.fontDisplay, fontWeight: 500, fontSize: 30, lineHeight: 1.04, color: T.ink, letterSpacing: '-0.02em' }}>{title}</h1>
      </div>
      {right}
    </div>
  )
}
