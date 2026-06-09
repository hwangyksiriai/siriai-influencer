import { createClient } from '@supabase/supabase-js'

// env가 없는 환경(예: 프리뷰 빌드의 프리렌더 단계)에서도 모듈 로드가
// 깨지지 않도록 플레이스홀더로 폴백합니다. 실제 env가 있으면 그 값이 우선됩니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
