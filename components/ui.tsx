'use client'

import React from 'react'
import { T } from '@/lib/theme'

/* ── 아이콘 (라인 스타일) ──────────────────────────────────────── */
type IcoProps = React.SVGProps<SVGSVGElement>
export const Ico = {
  search:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  chat:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 12.5C4 8.4 7.6 5.5 12 5.5s8 2.9 8 7-3.6 7-8 7c-1 0-2-.1-2.9-.4L5 20.5l1-3.2A6.6 6.6 0 0 1 4 12.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  bell:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  camera:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 8.5h3l1.3-2.2a1 1 0 0 1 .9-.5h5.6a1 1 0 0 1 .9.5L17 8.5h3a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  home:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 11.5 12 4l8 7.5M6 10v9.5a.5.5 0 0 0 .5.5H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a.5.5 0 0 0 .5-.5V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendar:(p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  plus:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  upload:  (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  doc:     (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 3.5h7.5L19 9v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 3.5V9h5.5M8.5 13h7M8.5 16.5h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/><path d="M5.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  back:    (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevron: (p: IcoProps) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

/* ── 작은 조각들 ──────────────────────────────────────────────── */
export function Pill({ children, bg, ink, size = 11 }: { children: React.ReactNode; bg: string; ink: string; size?: number }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999, fontFamily: T.fontUI, fontSize: size, fontWeight: 600, letterSpacing: '-0.01em', background: bg, color: ink, whiteSpace: 'nowrap' }}>{children}</span>
}

export function IconBtn({ icon: I, badge, onClick, ariaLabel }: { icon: (p: IcoProps) => React.ReactElement; badge?: boolean; onClick?: () => void; ariaLabel?: string }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} style={{ width: 44, height: 44, borderRadius: 14, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <I width="22" height="22" />
      {badge && <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 999, background: T.blushInk, border: `2px solid ${T.surface}` }} />}
    </button>
  )
}
