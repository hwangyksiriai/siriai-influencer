'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { T } from '@/lib/theme'

// 루트 진입 시 세션 여부만 확인하고 즉시 이동 (스플래시 애니메이션 제거)
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/home' : '/login')
    })
  }, [router])

  return <div style={{ minHeight: '100vh', background: T.bg }} />
}
