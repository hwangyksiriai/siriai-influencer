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
    const ctx = canvas.getContext('2d')!
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth, H = window.innerHeight
    canvas.width = W * DPR; canvas.height = H * DPR
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    const cx = W / 2, cy = H / 2

    let particles: P[] = []
    let raf = 0
    let start = 0
    let redirected = false

    // 심볼 이미지 → 밝은(흰) 픽셀 좌표 샘플
    function sampleSymbol(img: HTMLImageElement | null): Pt[] {
      const box = Math.min(W, H) * 0.42
      const pts: Pt[] = []
      if (img && img.width) {
        const off = document.createElement('canvas')
        const ratio = img.width / img.height
        let w = box, h = box / ratio
        if (h > box) { h = box; w = box * ratio }
        off.width = Math.ceil(w); off.height = Math.ceil(h)
        const o = off.getContext('2d')!
        o.drawImage(img, 0, 0, off.width, off.height)
        const d = o.getImageData(0, 0, off.width, off.height).data
        const step = 4
        for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) {
          const i = (y * off.width + x) * 4
          if (d[i + 3] > 128 && (d[i] + d[i + 1] + d[i + 2]) / 3 > 150) {
            pts.push({ x: cx - w / 2 + x, y: cy - h / 2 + y })
          }
        }
      }
      if (pts.length === 0) { // 폴백: 원형
        const r = box / 2
        for (let a = 0; a < Math.PI * 2; a += 0.12) for (let rr = r * 0.5; rr <= r; rr += 6) pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
      }
      return pts
    }

    // 텍스트 → 흰 글자 픽셀 좌표 샘플
    function sampleText(): Pt[] {
      const ow = Math.min(W - 40, 460), oh = 210
      const off = document.createElement('canvas')
      off.width = ow; off.height = oh
      const o = off.getContext('2d')!
      o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle'
      const lines: [string, string, number][] = [
        ['SIRIAI', "700 34px 'Helvetica Neue', Arial", oh * 0.22],
        ['시리아이', '500 20px sans-serif', oh * 0.46],
        ['しりあい', '400 16px sans-serif', oh * 0.63],
        ['Architecture for Insight, AI', '600 13px sans-serif', oh * 0.82],
      ]
      lines.forEach(([txt, font, y]) => { o.font = font; o.fillText(txt, ow / 2, y) })
      const d = o.getImageData(0, 0, ow, oh).data
      const pts: Pt[] = []
      const step = 3
      for (let y = 0; y < oh; y += step) for (let x = 0; x < ow; x += step) {
        if (d[(y * ow + x) * 4 + 3] > 128) pts.push({ x: cx - ow / 2 + x, y: cy - oh / 2 + y })
      }
      return pts
    }

    function build(img: HTMLImageElement | null) {
      const sym = sampleSymbol(img)
      const txt = sampleText()
      const N = Math.min(txt.length, 780)
      particles = []
      for (let i = 0; i < N; i++) {
        const tp = txt[Math.floor(i * txt.length / N)]
        const sp = sym[i % sym.length]
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          ch: CHARS[i % CHARS.length],
          sym: sp, txt: tp,
          sc: { x: Math.random() * W, y: Math.random() * H },
        })
      }
      start = performance.now()
      raf = requestAnimationFrame(loop)
    }

    function loop(now: number) {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,.9)'
      ctx.font = "7px 'Courier New', monospace"
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const phase = t < 1.8 ? 'sym' : t < 2.7 ? 'scatter' : 'txt'
      const k = 0.12
      for (const p of particles) {
        const tg = phase === 'sym' ? p.sym : phase === 'scatter' ? p.sc : p.txt
        p.x += (tg.x - p.x) * k
        p.y += (tg.y - p.y) * k
        ctx.fillText(p.ch, p.x, p.y)
      }
      if (t < 5.4) raf = requestAnimationFrame(loop)
      else if (!redirected) { redirected = true; check.then(() => router.replace(dest)) }
    }

    const img = new Image()
    img.onload = () => build(img)
    img.onerror = () => build(null)
    img.src = '/siriai-symbol-white.png'

    // 안전장치: 7초 넘으면 무조건 이동
    const safety = setTimeout(() => { if (!redirected) { redirected = true; check.then(() => router.replace(dest)) } }, 7000)

    return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
