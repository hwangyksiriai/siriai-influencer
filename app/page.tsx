'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home')
      else router.replace('/login')
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F3EEE2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'Helvetica Neue',sans-serif", fontSize: 18, fontWeight: 500, letterSpacing: '.1em', color: '#211A33' }}>SIRIAI</p>
    </div>
  )
}
