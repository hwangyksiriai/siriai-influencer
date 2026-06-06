'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Pt = { x: number; y: number }
type P = {
  x: number; y: number; ch: string; font: string; alpha: number
  seed: number; amp: number; sp: number
  sym: Pt; target: Pt; sc: Pt; ambient: boolean
}

const TINY = 'SIRIAIArchitectureInsightAI시리あいしＡＩ·'.split('')
const LOGO_FONTS = ['300 7px sans-serif', '400 8px sans-serif', '500 9px sans-serif', '700 11px sans-serif', '400 10px "Courier New", monospace', '300 12px sans-serif']
const AMBIENT_FONTS = ['300 6px sans-serif', '300 8px sans-serif', '400 7px sans-serif', '500 9px sans-serif']

export default function RootPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let dest = '/login'
    const check = supabase.auth.getSession().then(({ data }) => { dest = data.session ? '/home' : '/login' })

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const c = ctx

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth, H = window.innerHeight
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR)
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    c.scale(DPR, DPR)
    const cx = W / 2, cy = H / 2
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

    let particles: P[] = []
    let raf = 0, start = 0, redirected = false

    function circle(rad: number): Pt[] {
      const pts: Pt[] = []
      for (let a = 0; a < Math.PI * 2; a += 0.14) for (let rr = rad * 0.45; rr <= rad; rr += 7) pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
      return pts
    }
    function sampleImg(img: HTMLImageElement, boxW: number, boxH: number, ccx: number, ccy: number, step: number): Pt[] {
      try {
        const ratio = img.width / img.height
        let w = boxW, h = boxW / ratio
        if (h > boxH) { h = boxH; w = boxH * ratio }
        const off = document.createElement('canvas')
        off.width = Math.max(1, Math.ceil(w)); off.height = Math.max(1, Math.ceil(h))
        const o = off.getContext('2d'); if (!o) return []
        o.drawImage(img, 0, 0, off.width, off.height)
        const d = o.getImageData(0, 0, off.width, off.height).data
        const pts: Pt[] = []
        for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) {
          const i = (y * off.width + x) * 4
          if (d[i + 3] > 128 && (d[i] + d[i + 1] + d[i + 2]) / 3 > 140) pts.push({ x: ccx - w / 2 + x, y: ccy - h / 2 + y })
        }
        return pts
      } catch { return [] }
    }
    const randPt = (): Pt => ({ x: Math.random() * W, y: Math.random() * H })

    function build(symImg: HTMLImageElement | null, logoImg: HTMLImageElement | null) {
      const symPts = symImg ? sampleImg(symImg, Math.min(W, H) * 0.4, Math.min(W, H) * 0.4, cx, cy, 6) : circle(Math.min(W, H) * 0.2)
      const sym = symPts.length ? symPts : circle(Math.min(W, H) * 0.2)
      const list: P[] = []

      // 로고(워드마크) — 작은 글씨, 다양한 크기/굵기, 덜 빼곡하게
      const logoTop = cy - 64
      const logoPts = logoImg ? sampleImg(logoImg, Math.min(W - 70, 290), 110, cx, logoTop, 7) : []
      for (const lp of logoPts.slice(0, 300)) {
        list.push({ x: 0, y: 0, ch: pick(TINY), font: pick(LOGO_FONTS), alpha: rnd(0.6, 0.95), seed: Math.random() * 9, amp: rnd(0.8, 1.8), sp: rnd(0.6, 1.4), sym: { x: 0, y: 0 }, target: lp, sc: randPt(), ambient: false })
      }

      // 텍스트 줄 — 실제 글자, 잔잔한 흔들림
      const lines: [string, string, number][] = [
        ['시리아이', '600 19px sans-serif', cy + 30],
        ['しりあい', '400 16px sans-serif', cy + 58],
        ['Architecture for Insight, AI', '600 13px sans-serif', cy + 88],
      ]
      for (const [text, font, y] of lines) {
        c.font = font
        const total = c.measureText(text).width
        let x = cx - total / 2
        for (const ch of text) {
          const w = c.measureText(ch).width
          if (ch.trim()) list.push({ x: 0, y: 0, ch, font, alpha: 1, seed: Math.random() * 9, amp: rnd(0.4, 0.9), sp: rnd(0.5, 1), sym: { x: 0, y: 0 }, target: { x: x + w / 2, y }, sc: randPt(), ambient: false })
          x += w
        }
      }

      // 시작 위치 = 심볼 모양
      list.forEach((p, i) => { p.sym = sym[i % sym.length]; p.x = p.sym.x; p.y = p.sym.y })

      // 주변 앰비언트 — 항상 은은하게 떠다님 (심볼/로고와 무관)
      for (let i = 0; i < 90; i++) {
        const home = randPt()
        list.push({ x: home.x, y: home.y, ch: pick(TINY), font: pick(AMBIENT_FONTS), alpha: rnd(0.15, 0.4), seed: Math.random() * 9, amp: rnd(5, 11), sp: rnd(0.3, 0.7), sym: home, target: home, sc: home, ambient: true })
      }

      particles = list
      start = performance.now()
      raf = requestAnimationFrame(loop)
    }

    function loop(now: number) {
      const t = (now - start) / 1000
      const tw = now / 1000
      c.clearRect(0, 0, W, H)
      c.textAlign = 'center'; c.textBaseline = 'middle'
      const phase = t < 1.7 ? 'sym' : t < 2.7 ? 'scatter' : 'final'
      const bob = phase === 'final' ? Math.sin(tw * 0.5) * 3 : 0  // 로고 전체가 잔잔히 떠다님
      let curFont = ''
      for (const p of particles) {
        const tg = p.ambient ? p.target : (phase === 'sym' ? p.sym : phase === 'scatter' ? p.sc : p.target)
        const k = p.ambient ? 0.03 : 0.13
        p.x += (tg.x - p.x) * k
        p.y += (tg.y - p.y) * k
        const wx = Math.sin(tw * p.sp + p.seed) * p.amp
        const wy = Math.cos(tw * p.sp * 0.9 + p.seed) * p.amp
        if (p.font !== curFont) { c.font = p.font; curFont = p.font }
        c.globalAlpha = p.alpha
        c.fillStyle = '#fff'
        c.fillText(p.ch, p.x + wx, p.y + wy + (p.ambient ? 0 : bob))
      }
      c.globalAlpha = 1
      if (t < 6) raf = requestAnimationFrame(loop)
      else if (!redirected) { redirected = true; check.then(() => router.replace(dest)) }
    }

    let symImg: HTMLImageElement | null = null, logoImg: HTMLImageElement | null = null, loaded = 0
    function done() { loaded++; if (loaded >= 2) build(symImg, logoImg) }
    const s = new Image(); s.onload = () => { symImg = s; done() }; s.onerror = done; s.src = '/siriai-symbol-white.png'
    const l = new Image(); l.onload = () => { logoImg = l; done() }; l.onerror = done; l.src = '/siriai-logo-white.png'

    const safety = setTimeout(() => { if (!redirected) { redirected = true; check.then(() => router.replace(dest)) } }, 9000)
    return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
