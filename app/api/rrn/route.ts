import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptRRN, decryptRRN } from '@/lib/rrnCrypto'

export const runtime = 'nodejs'

// 주민등록번호는 평문 저장하지 않는다. 본인 JWT로 RLS를 그대로 적용해(서비스키 불필요)
// 서버에서 AES-256-GCM 암호화 후 저장, 조회 시 복호화해 본인에게만 반환.
function clientFor(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function bearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

// 본인 주민번호 조회(복호화)
export async function GET(req: NextRequest) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = clientFor(token)
  const { data: u } = await supabase.auth.getUser()
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('influencer_secure').select('rrn').eq('influencer_id', u.user.id).limit(1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rrn: data?.[0]?.rrn ? decryptRRN(data[0].rrn) : '' })
}

// 본인 주민번호 저장(암호화)
export async function POST(req: NextRequest) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const rrn = typeof body.rrn === 'string' ? body.rrn.trim() : ''
  const supabase = clientFor(token)
  const { data: u } = await supabase.auth.getUser()
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const stored = rrn ? encryptRRN(rrn) : ''
  const { error } = await supabase
    .from('influencer_secure')
    .upsert({ influencer_id: u.user.id, rrn: stored }, { onConflict: 'influencer_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
