'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Pt = { x: number; y: number }
type P = { x: number; y: number; ch: string; font: string; sym: Pt; target: Pt; sc: Pt }

const TINY = 'SIRIAIArchitctureInsightAI·시리あい'.split('')

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

    let particles: P[] = []
    let raf = 0, start = 0, redirected = false

    function circle(cxx: number, cyy: number, rad: number): Pt[] {
      const pts: Pt[] = []
      for (let a = 0; a < Math.PI * 2; a += 0.1) for (let rr = rad * 0.45; rr <= rad; rr += 5) pts.push({ x: cxx + Math.cos(a) * rr, y: cyy + Math.sin(a) * rr })
      return pts
    }

    // 이미지의 밝은(흰) 픽셀을 점 좌표로
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

    function rand(): Pt { return { x: Math.random() * W, y: Math.random() * H } }

    function build(symImg: HTMLImageElement | null, logoImg: HTMLImageElement | null) {
      // 심볼 점 (시작 모양)
      const symPts = symImg ? sampleImg(symImg, Math.min(W, H) * 0.4, Math.min(W, H) * 0.4, cx, cy, 4) : []
      const sym = symPts.length ? symPts : circle(cx, cy, Math.min(W, H) * 0.2)

      const list: P[] = []

      // 로고(워드마크) 점 — 작은 글씨로 모양 형성, 상단
      const logoTop = cy - 70
      const logoPts = logoImg ? sampleImg(logoImg, Math.min(W - 70, 300), 120, cx, logoTop, 4) : []
      const logoCapped = logoPts.slice(0, 560)
      for (const lp of logoCapped) {
        list.push({ x: 0, y: 0, ch: TINY[Math.floor(Math.random() * TINY.length)], font: "9px 'Courier New', monospace", sym: { x: 0, y: 0 }, target: lp, sc: rand() })
      }

      // 텍스트 줄 — 실제 글자가 제자리로
      const lines: [string, string, number][] = [
        ['시리아이', '600 19px sans-serif', cy + 28],
        ['しりあい', '400 16px sans-serif', cy + 56],
        ['Architecture for Insight, AI', '600 13px sans-serif', cy + 86],
      ]
      for (const [text, font, y] of lines) {
        c.font = font
        const total = c.measureText(text).width
        let x = cx - total / 2
        for (const ch of text) {
          const w = c.measureText(ch).width
          if (ch.trim()) list.push({ x: 0, y: 0, ch, font, sym: { x: 0, y: 0 }, target: { x: x + w / 2, y }, sc: rand() })
          x += w
        }
      }

      // 시작 위치 = 심볼 모양 (처음부터 모여 있음)
      list.forEach((p, i) => { p.sym = sym[i % sym.length]; p.x = p.sym.x; p.y = p.sym.y })
      particles = list
      start = performance.now()
      raf = requestAnimationFrame(loop)
    }

    function loop(now: number) {
      const t = (now - start) / 1000
      c.clearRect(0, 0, W, H)
      c.fillStyle = '#fff'
      c.textAlign = 'center'; c.textBaseline = 'middle'
      // 0~1.6: 심볼 / 1.6~2.7: 흩어짐 / 2.7~: 로고+텍스트
      const phase = t < 1.6 ? 'sym' : t < 2.7 ? 'scatter' : 'final'
      let curFont = ''
      for (const p of particles) {
        const tg = phase === 'sym' ? p.sym : phase === 'scatter' ? p.sc : p.target
        p.x += (tg.x - p.x) * 0.13
        p.y += (tg.y - p.y) * 0.13
        const f = phase === 'final' ? p.font : "9px 'Courier New', monospace"
        if (f !== curFont) { c.font = f; curFont = f }
        c.fillText(p.ch, p.x, p.y)
      }
      if (t < 5.8) raf = requestAnimationFrame(loop)
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
