// 게스트(로그인 없이 둘러보기) 모드 — 일단 임시.
// ⚠️ 정식 오픈 시 제거: 온보딩의 '둘러보기' 버튼과 각 페이지 가드의 isGuest() 분기.
const KEY = 'siriai_guest'

export function isGuest(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function setGuest(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch { /* 무시 */ }
}
