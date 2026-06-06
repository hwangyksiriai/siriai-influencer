'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    let dest = '/login'
    const check = supabase.auth.getSession().then(({ data }) => { dest = data.session ? '/home' : '/login' })
    const t = setTimeout(() => { check.then(() => router.replace(dest)) }, 2400)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <img src="/siriai-logo-white.png" alt="SIRIAI" style={{ height: 42, width: 'auto', animation: 'splashIn .9s ease' }} />
      <p style={{ fontSize: 12, letterSpacing: '.14em', color: 'rgba(255,255,255,.7)', margin: 0, animation: 'splashIn 1.6s ease' }}>Architecture for Insight, AI</p>
      <style>{`@keyframes splashIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
