// SIRIAI 디자인 토큰 (클라우드 팔레트) — 앱 전역 공유
// 색·폰트·라운드 등 시각 토큰을 한곳에서 관리합니다.

export const T = {
  bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F4F4F1', wash: '#F6F6F3',
  ink: '#1A1916', ink2: '#6F6E68', ink3: '#A6A59E', line: 'rgba(26,25,22,0.08)',
  accent: '#1F1E1A', accentInk: '#FFFFFF',
  sage: '#CBD9C5', blush: '#F0D2CB', lav: '#D6D2EC', butter: '#F2E2BE',
  sageInk: '#3F5238', blushInk: '#7A4B43', lavInk: '#494173', butterInk: '#6E5A23',
  danger: '#B0473B', ok: '#3F5238',
  radius: 28, radiusSm: 18, pad: 20, cardPad: 22,
  fontDisplay: "'Newsreader', Georgia, serif",
  fontUI: "'Pretendard', -apple-system, system-ui, 'Apple SD Gothic Neo', sans-serif",
} as const

// 카테고리별 추상 포토 그라데이션 (실사진으로 교체 가능)
export const PHOTO: Record<string, string> = {
  beauty:  'radial-gradient(120% 90% at 75% 15%, #F6DCD4 0%, #EBC3BA 38%, #D69E94 75%, #B97D72 100%)',
  food:    'radial-gradient(120% 90% at 70% 20%, #F4E6C4 0%, #E8CF95 40%, #C9A86A 78%, #9C7C47 100%)',
  fashion: 'radial-gradient(120% 90% at 72% 18%, #E2DCF0 0%, #CFC6E6 40%, #ABA0CE 78%, #837799 100%)',
  fitness: 'radial-gradient(120% 90% at 72% 16%, #D7E4E6 0%, #B7CFD4 42%, #8FAFB6 78%, #65878E 100%)',
  life:    'radial-gradient(120% 90% at 70% 18%, #DCE9D5 0%, #C2D6B8 42%, #9FBC93 78%, #76946A 100%)',
  tech:    'radial-gradient(120% 90% at 72% 16%, #E4E2DD 0%, #CBC8C0 42%, #A6A199 78%, #7C766C 100%)',
  default: 'radial-gradient(120% 90% at 72% 16%, #ECEAF2 0%, #DAD7E4 42%, #B9B5C6 78%, #8E8A9C 100%)',
}

// 칩 라벨/색 [라벨, 배경, 잉크]
export const CAT: Record<string, [string, string, string]> = {
  beauty:  ['뷰티', T.blush,  T.blushInk],
  food:    ['푸드', T.butter, T.butterInk],
  fashion: ['패션', T.lav,    T.lavInk],
  fitness: ['헬스', T.sage,   T.sageInk],
  life:    ['라이프', T.sage,  T.sageInk],
  tech:    ['테크', T.surface2, T.ink2],
  default: ['캠페인', T.surface2, T.ink2],
}

// 한글 카테고리명 → 포토/칩 키 매핑 (DB는 한글 카테고리를 저장)
export function catKey(category?: string | string[] | null): string {
  const first = Array.isArray(category) ? category[0] : category
  if (!first) return 'default'
  const map: Record<string, string> = {
    '색조': 'beauty', '스킨케어': 'beauty', '뷰티': 'beauty',
    '푸드': 'food', '맛집': 'food', '카페': 'food',
    '패션': 'fashion',
    '라이프': 'life', '육아': 'life',
    '피트니스': 'fitness', '헬스': 'fitness',
  }
  return map[first] || 'default'
}

export const won = (n?: number | null) => (n ?? 0).toLocaleString('ko-KR')
