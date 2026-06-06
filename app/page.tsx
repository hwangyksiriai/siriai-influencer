'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Pt = { x: number; y: number }
type P = { x: number; y: number; ch: string; sym: Pt; txt: Pt; sc: Pt }

const CHARS = 'SIRIAI시리아이しりあいArchitectureForInsightAI·'.split('')

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

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth, H = window.innerHeight
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR)
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    ctx.scale(DPR, DPR)
    const cx = W / 2, cy = H / 2

    let particles: P[] = []
    let raf = 0, start = 0, redirected = false

    function circleFallback(): Pt[] {
      const r = Math.min(W, H) * 0.2, pts: Pt[] = []
      for (let a = 0; a < Math.PI * 2; a += 0.1) for (let rr = r * 0.45; rr <= r; rr += 5) pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
      return pts
    }

    function sampleSymbol(img: HTMLImageElement): Pt[] {
      try {
        const box = Math.min(W, H) * 0.42
        const ratio = img.width / img.height
        let w = box, h = box / ratio
        if (h > box) { h = box; w = box * ratio }
        const off = document.createElement('canvas')
        off.width = Math.max(1, Math.ceil(w)); off.height = Math.max(1, Math.ceil(h))
        const o = off.getContext('2d'); if (!o) return circleFallback()
        o.drawImage(img, 0, 0, off.width, off.height)
        const d = o.getImageData(0, 0, off.width, off.height).data
        const pts: Pt[] = []
        for (let y = 0; y < off.height; y += 4) for (let x = 0; x < off.width; x += 4) {
          const i = (y * off.width + x) * 4
          if (d[i + 3] > 128 && (d[i] + d[i + 1] + d[i + 2]) / 3 > 140) pts.push({ x: cx - w / 2 + x, y: cy - h / 2 + y })
        }
        return pts.length ? pts : circleFallback()
      } catch { return circleFallback() }
    }

    function sampleText(): Pt[] {
      try {
        const ow = Math.min(W - 40, 460), oh = 210
        const off = document.createElement('canvas')
        off.width = ow; off.height = oh
        const o = off.getContext('2d'); if (!o) return []
        o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle'
        const lines: [string, string, number][] = [
          ['SIRIAI', "700 34px Arial, sans-serif", oh * 0.22],
          ['시리아이', '500 20px sans-serif', oh * 0.46],
          ['しりあい', '400 16px sans-serif', oh * 0.63],
          ['Architecture for Insight, AI', '600 13px sans-serif', oh * 0.82],
        ]
        lines.forEach(([txt, font, y]) => { o.font = font; o.fillText(txt, ow / 2, y) })
        const d = o.getImageData(0, 0, ow, oh).data
        const pts: Pt[] = []
        for (let y = 0; y < oh; y += 3) for (let x = 0; x < ow; x += 3) {
          if (d[(y * ow + x) * 4 + 3] > 128) pts.push({ x: cx - ow / 2 + x, y: cy - oh / 2 + y })
        }
        return pts
      } catch { return [] }
    }

    function build(img: HTMLImageElement | null) {
      const sym = img ? sampleSymbol(img) : circleFallback()
      let txt = sampleText()
      if (txt.length === 0) txt = sym // 텍스트 샘플 실패 시 심볼로 대체(빈 화면 방지)
      const N = Math.min(txt.length, 760)
      particles = []
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          ch: CHARS[i % CHARS.length],
          sym: sym[i % sym.length],
          txt: txt[Math.floor(i * txt.length / N)],
          sc: { x: Math.random() * W, y: Math.random() * H },
        })
      }
      start = performance.now()
      raf = requestAnimationFrame(loop)
    }

    function loop(now: number) {
      const c = ctx as CanvasRenderingContext2D
      const t = (now - start) / 1000
      c.clearRect(0, 0, W, H)
      c.fillStyle = '#fff'
      c.font = "9px 'Courier New', monospace"
      c.textAlign = 'center'; c.textBaseline = 'middle'
      const phase = t < 1.9 ? 'sym' : t < 2.9 ? 'scatter' : 'txt'
      for (const p of particles) {
        const tg = phase === 'sym' ? p.sym : phase === 'scatter' ? p.sc : p.txt
        p.x += (tg.x - p.x) * 0.13
        p.y += (tg.y - p.y) * 0.13
        c.fillText(p.ch, p.x, p.y)
      }
      if (t < 5.6) raf = requestAnimationFrame(loop)
      else if (!redirected) { redirected = true; check.then(() => router.replace(dest)) }
    }

    const img = new Image()
    img.onload = () => build(img)
    img.onerror = () => build(null)
    img.src = '/siriai-symbol-white.png'

    const safety = setTimeout(() => { if (!redirected) { redirected = true; check.then(() => router.replace(dest)) } }, 8000)
    return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
