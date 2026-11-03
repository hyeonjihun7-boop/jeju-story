// 레벨별로 모습이 달라지는 도트 탐험가. 레벨 1 "육지 손님"부터 6 "탐험 대장"까지 장비가 하나씩 늘어난다.
//   Lv1 육지 손님: 캐리어 · 멍한 표정      Lv2 제주 새내기: 밀짚모자 · 감귤 한 알
//   Lv3 탐험 수습생: 배낭 · 지도           Lv4 제주 탐험가: 모자 · 조끼 · 트레킹 폴
//   Lv5 제주 길잡이: 올레 리본 깃발 · 목도리  Lv6 탐험 대장: 금관 · 망토 · 감귤 깃발 · 반짝임
// drawAvatar(g, ox, oy, lv, t, jump): (ox, oy)=발 밑 가운데, 높이 약 45칸, t=초(숨쉬기·깜빡임·깃발 흔들림)
export const AVATAR_W = 64
export const AVATAR_H = 56
export const AVATAR_ORIGIN = [28, 53]
export const AVATAR_SKY = ['#cdeff0', '#bfeee6', '#bfe3f0', '#c5dff0', '#d4e6c0', '#ffe9b0']

const SK = '#f1c59b', SKS = '#d9a276', HAIR = '#4a3326'
const rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)) }
const dark = (c, f = 0.22) => mix(c, '#241a3a', f)
const light = (c, f = 0.25) => mix(c, '#fff6dc', f)

export function drawAvatar(g, ox, oy, lv = 0, t = 0, jump = 0) {
  const L = Math.max(0, Math.min(5, lv | 0))
  const up = Math.sin(t * 2.2) > 0 ? -1 : 0 // 숨 쉬듯 몸이 한 칸 오르내림
  const fy = Math.round(oy - jump), by = fy + up
  const R = (x, y, w, h, c, base = by) => { g.fillStyle = c; g.fillRect(Math.round(ox + x), Math.round(base + y), w, h) }
  const P = (x, y, c, base = by) => R(x, y, 1, 1, c, base)

  // 그림자(바닥에 남고, 뛰면 작아진다)
  g.fillStyle = 'rgba(40,60,60,0.28)'
  const sw = Math.max(5, 12 - Math.round(jump / 3))
  g.fillRect(Math.round(ox - sw), Math.round(oy) - 1, sw * 2 + 2, 2); g.fillRect(Math.round(ox - sw + 2), Math.round(oy), sw * 2 - 2, 1)

  const top = [ '#f4f4ee', '#4fc3c8', '#6aa84f', '#f4f4ee', '#d9d4b8', '#2a3f7a' ][L]
  const vest = [null, null, null, '#e8892a', '#2f7d4a', null][L]
  const topS = dark(top, 0.2), topL = light(top, 0.2)
  const pants = L <= 1 ? '#d9c7a3' : L <= 3 ? '#a89870' : '#6b7a4a'
  const boots = L <= 1 ? '#ffffff' : '#6b4423'

  // 망토(뒤)
  if (L === 5) {
    for (let y = -21; y <= -3; y++) {
      const left = -8 - Math.round((y + 21) * 0.12 + Math.sin(t * 3 + y * 0.25) * 1.3)
      R(left, y, 7 - left, 1, y % 5 === 0 ? '#e0535f' : '#d63b4a')
      P(left, y, '#a52a38')
    }
  }
  // 배낭(뒤)
  if (L >= 2) {
    const bp = [null, null, '#d9822b', '#6b8a4a', '#8a5a2a', '#2a3f7a'][L]
    R(-11, -22, 7, 12, bp); R(-11, -22, 2, 12, light(bp, 0.2)); R(-11, -10, 7, 1, dark(bp))
    if (L === 4) R(-11, -25, 7, 3, '#5a7a9a')
  }

  // 다리와 신발
  if (L <= 1) { R(-5, -10, 10, 4, pants); R(-4, -6, 3, 4, SK, fy); R(1, -6, 3, 4, SK, fy) }
  else { R(-4, -10, 3, 8, pants, fy); R(1, -10, 3, 8, pants, fy); R(-4, -10, 3, 1, light(pants, 0.2), fy) }
  R(-5, -2, 5, 2, boots, fy); R(0, -2, 5, 2, boots, fy); R(-5, -1, 5, 1, dark(boots, 0.3), fy); R(0, -1, 5, 1, dark(boots, 0.3), fy)

  // 소품(몸 뒤쪽에 보이는 것)
  if (L === 0) { // 바퀴 달린 캐리어
    R(8, -14, 9, 12, '#3b82d8', fy); R(8, -14, 2, 12, '#5aa0f0', fy); R(8, -9, 9, 1, '#2a5fa8', fy); R(9, -2, 2, 2, '#333', fy); R(15, -2, 2, 2, '#333', fy)
    R(12, -21, 1, 7, '#555', fy); R(10, -22, 5, 1, '#555', fy)
  }
  if (L === 3) { R(10, -31, 1, 31, '#8a8a92', fy); R(9, -32, 3, 2, '#d24a3a', fy); R(10, -1, 1, 1, '#555', fy) } // 트레킹 폴
  if (L === 4) { // 올레 리본 깃발(파랑·주황)
    R(12, -46, 1, 46, '#7a5a3a', fy)
    for (let i = 0; i < 11; i++) { const w = Math.round(Math.sin(t * 5 - i * 0.6) * 1.6); R(13 + i, -45 + w, 1, 3, '#2f6ed8', fy); R(13 + i, -42 + w, 1, 3, '#ff8a1f', fy) }
  }
  if (L === 5) { // 감귤 깃발
    R(12, -48, 1, 48, '#c98a0a', fy); R(11, -49, 3, 2, '#ffcf3a', fy)
    for (let i = 0; i < 15; i++) { const w = Math.round(Math.sin(t * 4 - i * 0.5) * 1.4); R(13 + i, -47 + w, 1, 10, '#fffdf4', fy); P(13 + i, -47 + w, '#2a3f7a', fy); P(13 + i, -38 + w, '#2a3f7a', fy) }
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) P(20 + x, -42 + y + Math.round(Math.sin(t * 4 - 7 * 0.5) * 1.4), y < -1 && x < 0 ? '#ffb347' : '#ff8a1f', fy)
  }

  // 팔 (소매 → 맨팔)
  const longSleeve = L >= 4
  const arm = (x, front) => { for (let i = 0; i < 10; i++) R(x, -20 + i, 3, 1, i < (longSleeve ? 8 : 4) ? (front ? top : topS) : (front ? SK : SKS)); if (L === 5) R(x, -13, 3, 1, '#ffcf3a') }
  arm(-8, false)
  // 몸통
  R(-5, -21, 10, 11, top); R(-5, -21, 2, 11, topS); R(3, -21, 2, 11, topL); R(-5, -11, 10, 1, topS)
  R(-1, -22, 3, 1, SKS) // 목
  if (L === 1) for (let y = -20; y < -11; y++) for (let x = -4; x < 5; x++) if ((x * 3 + y * 5) % 7 === 0) P(x, y, (x + y) % 2 ? '#ffffff' : '#ff9a1f')
  if (vest) { R(-5, -21, 3, 11, vest); R(2, -21, 3, 11, vest); R(-5, -21, 1, 11, dark(vest)); R(4, -21, 1, 11, light(vest, 0.15)); if (L === 4) { R(-4, -15, 3, 2, dark(vest, 0.35)); R(-4, -19, 1, 3, '#2f6ed8'); R(-3, -19, 1, 3, '#ff8a1f') } }
  if (L === 5) { P(0, -18, '#ffcf3a'); P(0, -15, '#ffcf3a'); P(0, -12, '#ffcf3a'); R(-2, -21, 5, 1, '#ffcf3a'); R(-1, -17, 3, 3, '#ffcf3a'); P(0, -16, '#241a3a') } // 금단추, 칼라, 나침반 목걸이
  if (L === 4) { R(-2, -22, 5, 2, '#e8557f'); R(-1, -20, 3, 1, '#e8557f') }                                                       // 목도리
  // 앞쪽 팔과 손의 소품
  if (L === 0) { R(5, -20, 3, 4, top); R(5, -16, 3, 2, SK); R(8, -17, 4, 2, SK) }
  else if (L === 1) { R(5, -20, 3, 4, top); R(5, -16, 3, 2, SK); R(8, -17, 3, 2, SK); R(10, -21, 5, 5, '#ff9a1f'); R(10, -21, 2, 2, '#ffd08a'); R(12, -23, 2, 2, '#3fa650'); R(10, -17, 5, 1, '#c4580a') }
  else if (L === 2) { R(5, -20, 3, 4, top); R(5, -16, 3, 2, SK); R(8, -17, 3, 2, SK); R(8, -20, 9, 3, '#e8d8a8'); R(7, -20, 1, 3, '#c4a060'); R(17, -20, 1, 3, '#c4a060'); R(12, -20, 1, 3, '#d63b4a') }
  else if (L === 3) { R(5, -20, 3, 4, top); R(5, -16, 3, 2, SK); R(8, -19, 3, 3, SK) }
  else if (L === 4) { R(5, -20, 3, 8, top); R(5, -12, 3, 2, SK); R(8, -14, 4, 3, SK) }
  else { R(5, -20, 3, 8, top); R(5, -13, 3, 1, '#ffcf3a'); R(5, -12, 3, 2, SK); R(8, -14, 4, 3, SK) }

  // 머리
  const hy = -29
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if ((x / 6) ** 2 + (y / 6.8) ** 2 <= 1) P(x, hy + y, x < -3 ? SKS : x > 3 ? light(SK, 0.12) : SK)
  // 표정
  const blink = t % 3.4 < 0.14
  if (blink) { R(-3, hy + 1, 2, 1, '#2a2430'); R(2, hy + 1, 2, 1, '#2a2430') }
  else { R(-3, hy, 2, 3, '#ffffff'); R(2, hy, 2, 3, '#ffffff'); R(-2 + (L === 0 ? -1 : 0), hy, 1, 3, '#2a2430'); R(3 + (L === 0 ? -1 : 0), hy, 1, 3, '#2a2430'); P(-3, hy - 1, '#2a2430'); P(-2, hy - 1, '#2a2430'); P(2, hy - 1, '#2a2430'); P(3, hy - 1, '#2a2430') }
  R(-3, hy - 3, 2, 1, HAIR); R(2, hy - 3, 2, 1, HAIR)
  P(-5, hy + 3, '#f19a9a'); P(5, hy + 3, '#f19a9a'); P(0, hy + 3, SKS)
  if (L === 0) { R(0, hy + 5, 2, 1, '#b5584f') }
  else if (L <= 2) { P(-2, hy + 4, '#b5584f'); R(-1, hy + 5, 3, 1, '#b5584f'); P(2, hy + 4, '#b5584f') }
  else { R(-2, hy + 4, 5, 2, '#7a2a30'); R(-2, hy + 4, 5, 1, '#ffffff'); P(0, hy + 5, '#e86a74') }
  // 머리카락
  if (L !== 5) { for (let y = -8; y <= -3; y++) for (let x = -7; x <= 7; x++) if ((x / 6.6) ** 2 + ((y + 1) / 7.2) ** 2 <= 1) P(x, hy + y, y < -5 && x > 0 ? light(HAIR, 0.25) : HAIR) }
  else { for (let y = -8; y <= -5; y++) for (let x = -7; x <= 7; x++) if ((x / 6.6) ** 2 + ((y + 1) / 7.2) ** 2 <= 1) P(x, hy + y, HAIR) }
  R(-7, hy - 3, 2, 5, HAIR); R(6, hy - 3, 2, 5, HAIR)
  // 모자
  if (L === 1 || L === 2) {
    R(-9, hy - 5, 19, 2, '#e6c06a'); R(-9, hy - 4, 19, 1, '#b8923f'); R(-5, hy - 11, 11, 6, '#f2d68a'); R(-5, hy - 7, 11, 1, L === 1 ? '#d24a3a' : '#2f7d6f')
    for (let x = -9; x <= 9; x += 3) P(x, hy - 5, '#caa24c')
  } else if (L === 3) { R(-8, hy - 5, 17, 2, '#a89868'); R(-6, hy - 10, 13, 5, '#b9a878'); R(-6, hy - 6, 13, 1, '#8a7a50') }
  else if (L === 4) { R(-8, hy - 5, 17, 2, '#587a3a'); R(-6, hy - 10, 13, 5, '#6b8a4a'); R(-6, hy - 6, 13, 1, '#3f5a28'); R(6, hy - 15, 1, 6, '#e8557f'); R(7, hy - 16, 1, 4, '#ff8aa8') }
  else if (L === 5) { // 금관과 감귤 보석
    R(-7, hy - 8, 14, 3, '#ffcf3a'); R(-7, hy - 5, 14, 1, '#c98a0a'); R(-7, hy - 11, 3, 3, '#ffcf3a'); R(-2, hy - 12, 4, 4, '#ffcf3a'); R(4, hy - 11, 3, 3, '#ffcf3a')
    R(-1, hy - 11, 2, 2, '#ff8a1f'); P(-6, hy - 7, '#ff8a1f'); P(5, hy - 7, '#ff8a1f'); P(0, hy - 7, '#2fb0a0'); P(-3, hy - 7, '#e8557f'); P(3, hy - 7, '#e8557f')
    R(-7, hy - 8, 14, 1, '#fff0a0')
  }
  // 반짝임(Lv4 이상)
  if (L >= 4) for (let i = 0; i < (L === 5 ? 6 : 3); i++) {
    const a = t * 1.7 + (i * Math.PI * 2) / (L === 5 ? 6 : 3), sx = Math.round(Math.cos(a) * 17), sy = Math.round(-22 + Math.sin(a) * 15)
    if (Math.sin(t * 6 + i * 2) > -0.3) { P(sx, sy, '#fff7c2', fy); P(sx - 1, sy, '#ffe9a0', fy); P(sx + 1, sy, '#ffe9a0', fy); P(sx, sy - 1, '#ffe9a0', fy); P(sx, sy + 1, '#ffe9a0', fy) }
  }
}
