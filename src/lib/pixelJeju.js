// 탐험하기 상단의 제주 도트 장면 (256x256 캔버스). createScene(canvas) 가 정지 레이어를 한 번 그려 두고,
// frame(t) 이 구름·갈매기·바다·야자수·인물을 시간 t(초)에 맞춰 그린다. 모든 그림은 코드로 한 칸씩 찍는다.
export function createScene(cvs) {

  const W = 256, H = 256, HOR = 165
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
  const main = cvs.getContext('2d', { willReadFrequently: true })
  let g = main
  let seed = 11
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= g.canvas.width || y >= g.canvas.height) return; g.fillStyle = c; g.fillRect(x, y, 1, 1) }
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) }
  const rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)) }
  const shade = (c, f) => mix(c, '#241a3a', f)
  const tint = (c, f) => mix(c, '#fff6dc', f)
  const warm = (sk, f) => mix(sk, '#b8584a', f)
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
  const dith = (x, y, f) => f * 16 > BAYER[y & 3][x & 3]
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
  const smooth = (t) => t * t * (3 - 2 * t)
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf }
  const fbm = (x, y) => vnoise(x, y) * 0.5 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.2

  // ───────────── 정지 레이어 ─────────────
  const SKYL = mk(), FA = mk(), FB = mk()

  // ───────────── 날씨·시간대(mood) ─────────────
  let mood = { kind: 'clear', phase: 'day', wind: 2, heavy: false, rain: 0, sunX: null }
  const windK = () => Math.max(0.4, Math.min(3.2, (mood.wind ?? 2) / 3.2))

  // 하늘: 날씨와 시간대에 맞춰 다시 그린다
  const SKYS = {
    day: ['#35c9d2', '#5fdbdc', '#8aeae3', '#b2f3ea', '#d6f9f0', '#eefcf6'],
    dawn: ['#6c7fd2', '#9a90e2', '#d99ad0', '#f6a8b8', '#ffc4a8', '#ffe2b8'],
    golden: ['#3f9ad6', '#6fb2e4', '#b8c0d8', '#f4c090', '#ffa868', '#ffd488'],
    dusk: ['#262c78', '#58408f', '#b04a86', '#f0706a', '#ff9460', '#ffc27a'],
    night: ['#080e2c', '#0f1a4a', '#18286a', '#223a84', '#2d4a98', '#3b5ba8'],
  }
  const grayOf = (c, k, dark = 0) => { const [r, gg, b] = rgb(c), l = r * 0.3 + gg * 0.59 + b * 0.11; return mix(toHex([r + (l - r) * k, gg + (l - gg) * k, b + (l - b) * k]), '#10141c', dark) }
  function skyColors() {
    const base = SKYS[mood.phase] ?? SKYS.day
    if (mood.kind === 'clear' || mood.kind === 'partly') return base
    const k = { overcast: [0.5, 0.05], fog: [0.62, 0], drizzle: [0.58, 0.12], rain: [0.62, 0.22], storm: [0.7, 0.4], snow: [0.5, 0.08] }[mood.kind] ?? [0, 0]
    const lift = mood.kind === 'fog' ? 0.35 : 0
    return base.map((c) => mix(grayOf(c, k[0], k[1]), '#e8edf0', lift))
  }
  function buildSky() {
    const prev = g; g = SKYL.getContext('2d'); g.clearRect(0, 0, W, H)
    const SKY = skyColors()
    for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
      const t = Math.pow(y / HOR, 0.9) * (SKY.length - 1), i = Math.min(SKY.length - 2, Math.floor(t)), f = t - i
      px(x, y, dith(x, y, f) ? SKY[i + 1] : SKY[i])
    }
    const clearish = mood.kind === 'clear' || mood.kind === 'partly'
    if (mood.phase === 'day' && clearish) for (const [y0, y1, c] of [[58, 62, '#7fe3e0'], [77, 80, '#a2eee6'], [114, 117, '#d2f8ef']]) for (let y = y0; y < y1; y++) for (let x = 0; x < 160; x++) if (dith(x, y, 0.55)) px(x, y, c)
    let sd = 7; const r2 = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296)
    if (mood.phase === 'night' || mood.phase === 'dusk') {
      for (let k = 0; k < (mood.phase === 'night' ? 90 : 26); k++) {
        const x = (r2() * W) | 0, y = (r2() * HOR * (mood.phase === 'night' ? 0.8 : 0.4)) | 0
        if (clearish || r2() < 0.2) { px(x, y, r2() < 0.7 ? '#dfe6ff' : '#ffffff'); if (r2() < 0.15) { px(x - 1, y, '#8f9fe0'); px(x + 1, y, '#8f9fe0'); px(x, y - 1, '#8f9fe0'); px(x, y + 1, '#8f9fe0') } }
      }
    }
    if (mood.phase === 'night' && mood.kind !== 'rain' && mood.kind !== 'storm') { // 달
      for (let y = -18; y <= 18; y++) for (let x = -18; x <= 18; x++) { const d = Math.hypot(x, y); if (d <= 9 && Math.hypot(x - 4, y + 2) > 8.2) px(50 + x, 36 + y, d < 6 ? '#f6f2d6' : '#e4dfb8'); else if (d > 10 && d < 17 && dith(50 + x, 36 + y, (17 - d) / 14)) px(50 + x, 36 + y, '#6f84c8') }
    }
    if (mood.sunX != null && mood.phase !== 'day' && mood.phase !== 'night') { // 해
      const sx = mood.sunX, sy = mood.phase === 'golden' ? HOR - 16 : mood.phase === 'dusk' ? HOR - 5 : HOR - 9
      const core = { golden: '#fff0b0', dusk: '#ff8a46', dawn: '#ffd9a8' }[mood.phase], glow = { golden: '#ffd070', dusk: '#ff6a50', dawn: '#ffb090' }[mood.phase]
      for (let y = -26; y <= 26; y++) for (let x = -26; x <= 26; x++) { const d = Math.hypot(x, y); if (d <= 11) px(sx + x, sy + y, core); else if (d < 26 && dith(sx + x, sy + y, ((26 - d) / 26) * 0.7)) px(sx + x, sy + y, glow) }
    }
    g = prev
  }

  // 구름은 하나씩 따로 그려 두고 흘려 보낸다
  function cloudSprite(rx, ry, so, pal) {
    const w = Math.ceil(rx * 2.6), h = Math.ceil(ry * 2.7), c = mk(w, h), prev = g
    g = c.getContext('2d')
    const cx = w / 2, cy = h * 0.52
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ex = (x - cx) / rx, ey = (y - cy) / ry
      const base = 1 - Math.sqrt(ex * ex + ey * ey * 1.15)
      const n = fbm(x * 0.068 + so + 20, y * 0.098 + so * 0.7 + 20)
      const d = base * 1.2 + (n - 0.5) * 0.95
      if (d < 0.12) continue
      const low = (y - (cy - ry * 0.5)) / (ry * 1.5)
      const light = fbm(x * 0.05 + so + 29, (y + 5) * 0.075 + 20)
      let col
      if (d < 0.2) col = pal[2]
      else if (low > 0.62) col = dith(x, y, (low - 0.62) * 3) ? pal[3] : pal[2]
      else if (low > 0.28 || light < 0.4) col = dith(x, y, Math.max(0.25, low)) ? pal[1] : pal[0]
      else col = pal[0]
      px(x, y, col)
    }
    g = prev
    return c
  }
  const PAL1 = ['#ffffff', '#e4e2fa', '#bcc0ee', '#979edb'], PAL2 = ['#ffffff', '#e6f4fb', '#c1e2f1', '#9ccce4']
  const cloudPals = () => {
    const wet = mood.kind === 'rain' || mood.kind === 'storm' || mood.kind === 'drizzle'
    if (wet) return mood.phase === 'night' ? ['#6a7690', '#4a5670', '#323e58', '#222c44'] : ['#b8c0cc', '#939eae', '#707c8e', '#525e72']
    if (mood.kind === 'overcast' || mood.kind === 'snow') return mood.phase === 'night' ? ['#8a92aa', '#6a7490', '#4a5470', '#323c58'] : ['#e2e7ec', '#bfc7d1', '#9ca6b3', '#7a8594']
    if (mood.kind === 'fog') return ['#f4f6f8', '#e0e5ea', '#ccd3da', '#b8c0c9']
    if (mood.phase === 'night') return ['#8a96c8', '#5a6aa0', '#3a4880', '#242e60']
    if (mood.phase === 'dusk') return ['#ffc6b0', '#e090a4', '#a65c8c', '#5e3a74']
    if (mood.phase === 'golden') return ['#fff0e0', '#ffd2b0', '#eea08a', '#c07a8a']
    if (mood.phase === 'dawn') return ['#fff0f4', '#f6cce2', '#d9a2d4', '#a88ac8']
    return null
  }
  let CLOUDS = []
  function buildClouds() {
    const P = cloudPals(), a = P ?? PAL1, b = P ?? PAL2, c3 = P ?? ['#ffffff', '#eef7fc', '#cfe8f4', '#b0d8ec']
    const sp = 0.6 + windK() * 0.5
    const L = {
      clear: [[37, 23, 4.1, a, 110, 200, 4.4], [29, 12, 5.5, c3, 36, 40, 2.8]],
      partly: [[83, 51, 1.3, a, 18, 120, 3.2], [37, 23, 4.1, a, 110, 200, 4.4], [35, 16, 7.2, b, 108, 60, 2.2], [37, 19, 2.8, b, 124, 0, 1.6], [29, 12, 5.5, c3, 36, 40, 2.8]],
      overcast: [[83, 51, 1.3, a, 4, 100, 3.2], [83, 40, 3.7, a, 40, 220, 2.6], [70, 36, 8.1, a, 76, 10, 3.4], [60, 24, 2.2, b, 106, 150, 2.2], [66, 30, 6.6, a, 24, 250, 4], [50, 20, 9.4, b, 118, 60, 1.8]],
      fog: [[90, 26, 3.3, a, 70, 40, 1.4], [90, 24, 6.1, a, 100, 180, 1.8], [80, 20, 8.8, a, 130, 100, 1.2]],
    }
    L.rain = [...L.overcast, [75, 34, 11.4, a, 62, 170, 3.8]]; L.storm = L.rain; L.drizzle = L.overcast; L.snow = L.overcast
    CLOUDS = (L[mood.kind] ?? L.partly).map(([rx, ry, so, pal, y, x0, v]) => ({ s: cloudSprite(rx, ry, so, pal), y, x0, v: v * sp }))
  }

  // 앞 레이어 A: 한라산 · 바다 바탕 · 해안 · 풀밭 · 나무 · 돌하르방
  g = FA.getContext('2d')
  const ridge = (x) => { const t = x / 165; return t < 0 || t > 1 ? 0 : Math.sin(Math.PI * Math.pow(t, 0.72)) * 45 + Math.sin(x * 0.26) * 1 }
  for (let x = 0; x < 165; x++) {
    const h = Math.round(ridge(x))
    for (let y = HOR - h; y < HOR; y++) {
      const rel = (y - (HOR - h)) / Math.max(1, h)
      let c = rel < 0.06 ? '#dfe6fa' : rel < 0.38 ? (dith(x, y, 0.4) ? '#b4c2ec' : '#c4cff2') : rel < 0.7 ? (dith(x, y, 0.5) ? '#93a7de' : '#a3b4e6') : '#7f98cf'
      if (rel > 0.8) c = dith(x, y, 0.5) ? '#6aa98a' : '#5e9d84'
      px(x, y, c)
    }
  }
  rect(58, HOR - 47, 12, 3, '#8da2da'); rect(61, HOR - 48, 6, 1, '#c9d3f4')
  for (const x of [40, 83, 104]) for (let y = 0; y < 18; y++) if (dith(x + y, y, 0.4)) px(x + y * 0.3, HOR - 37 + y, '#8fa4dc')
  for (const [cx, w, h] of [[13, 16, 9], [115, 19, 11], [149, 13, 8]]) for (let x = -w; x <= w; x++) { const hh = Math.round(h * (1 - (x / w) ** 2)); for (let y = HOR - hh; y < HOR; y++) px(cx + x, y, y < HOR - hh + 2 ? '#a9d8ac' : '#74b88a') }
  for (let x = -12; x <= 12; x++) { const hh = Math.round(12 * (1 - Math.abs(x) / 12.7)); for (let y = HOR - hh; y < HOR; y++) px(213 + x, y, y < HOR - hh + 2 ? '#9fd6ae' : '#5aa07c') }
  const SEA = ['#58ddd4', '#3ecbc6', '#2bb4bc', '#1f9cab', '#1b8aa0']
  for (let y = HOR; y < 195; y++) for (let x = 0; x < W; x++) {
    const t = ((y - HOR) / 30) * (SEA.length - 1), i = Math.min(SEA.length - 2, Math.floor(t)), f = t - i
    px(x, y, dith(x, y, f) ? SEA[i + 1] : SEA[i])
  }
  for (let x = 0; x < W; x++) { px(x, HOR, '#f2fffc'); px(x, HOR + 1, '#c9fbf5') }
  for (let x = 0; x < W; x++) { const hh = 4 + Math.round(fbm(x * 0.15, 3) * 7); for (let y = 196 - hh; y < 198; y++) px(x, y, y < 196 - hh + 1 ? '#5b5d68' : dith(x, y, 0.5) ? '#2f3039' : '#3a3b45') }
  for (let k = 0; k < 200; k++) { const x = (rnd() * W) | 0; px(x, 187 + ((rnd() * 8) | 0), rnd() < 0.5 ? '#ffffff' : '#d8fbf7') }
  for (let x = 0; x < W; x++) if ((x * 7 + (x >> 2) * 5) % 9 < 5) px(x, 198, '#e9fffb')
  rect(0, 198, W, 10, '#5cb558')
  for (let x = 0; x < W; x++) for (let y = 198; y < 208; y++) if (dith(x, y, 0.35)) px(x, y, '#4ba44c')
  for (let k = 0; k < 900; k++) { const x = (rnd() * W) | 0, y = 198 + ((rnd() * 9) | 0); if (Math.abs(x - 128) < 54 && rnd() < 0.65) continue; px(x, y, rnd() < 0.7 ? '#ffd83a' : '#fff07a'); if (rnd() < 0.4) px(x, y + 1, '#3f9a45') }
  function citrus(cx, base, r) {
    rect(cx - 2, base - 13, 4, 13, '#6b4423'); px(cx - 2, base - 13, '#8a5a2b')
    for (let y = -r; y <= r * 0.7; y++) for (let x = -r - 4; x <= r + 4; x++) {
      if ((x * x) / ((r + 4) ** 2) + (y * y) / (r * r) > 1) continue
      px(cx + x, base - 13 - r * 0.6 + y, (y < -r * 0.3 && x > -2) ? '#52bf56' : dith(x + cx, y + base, 0.45) ? '#2c8a3e' : '#369b46')
    }
    for (let k = 0; k < 24; k++) { const a = rnd() * 6.28, d = rnd() * r * 0.9, x = cx + Math.cos(a) * (d + 3), y = base - 13 - r * 0.6 + Math.sin(a) * d * 0.9; px(x, y, '#ff9a1f'); px(x + 1, y, '#ffb347'); px(x, y + 1, '#e06a10') }
  }
  function harubang(x, y) {
    const S = '#8d8a85', L = '#bbb7b0', D = '#5a5753'
    rect(x + 1, y, 13, 3, S); rect(x - 2, y + 3, 19, 2, S); rect(x + 4, y - 4, 9, 4, S); rect(x + 4, y - 5, 9, 1, L); rect(x - 2, y + 4, 19, 1, D)
    rect(x + 3, y + 5, 11, 8, L); rect(x + 11, y + 5, 3, 8, S)
    rect(x + 4, y + 7, 3, 3, D); rect(x + 10, y + 7, 3, 3, D); rect(x + 8, y + 9, 1, 3, S); rect(x + 6, y + 12, 5, 1, D)
    rect(x + 2, y + 13, 13, 12, S); rect(x + 3, y + 13, 4, 11, L); rect(x + 13, y + 13, 2, 12, D)
    rect(x + 5, y + 18, 4, 4, L); rect(x + 10, y + 18, 4, 4, L); rect(x, y + 25, 17, 2, D)
    for (let k = 0; k < 40; k++) px(x + 2 + ((rnd() * 13) | 0), y + 5 + ((rnd() * 22) | 0), D)
  }
  citrus(40, 205, 16); citrus(235, 205, 15); harubang(72, 178)

  // 앞 레이어 B: 난간 · 길 · 귤 트럭
  g = FB.getContext('2d')
  for (const y of [204, 211]) { rect(0, y, W, 3, '#dfe5ea'); rect(0, y + 2, W, 1, '#aab3bb'); rect(0, y, W, 1, '#f3f7fa') }
  for (let x = 8; x < W; x += 24) { rect(x, 200, 4, 19, '#cfd7dd'); rect(x, 200, 1, 19, '#f3f7fa'); rect(x + 3, 200, 1, 19, '#9aa4ad'); rect(x - 1, 199, 6, 2, '#e7edf1') }
  rect(0, 219, W, 37, '#8e949b')
  for (let x = 0; x < W; x++) for (let y = 219; y < 256; y++) if (dith(x, y, 0.28)) px(x, y, '#9aa0a7')
  for (let k = 0; k < 260; k++) px((rnd() * W) | 0, 222 + ((rnd() * 32) | 0), '#7d838a')
  rect(0, 219, W, 1, '#6e747b'); rect(0, 220, W, 1, '#b6bcc2')
  for (let x = 10; x < W; x += 40) rect(x, 238, 19, 3, '#edf0f2')
  rect(0, 251, W, 5, '#868c93')
  function truck(x, y) {
    rect(x, y + 8, 48, 19, '#f5c518'); rect(x, y + 8, 48, 3, '#ffe36e'); rect(x, y + 23, 48, 4, '#d49a0b')
    rect(x + 32, y, 19, 16, '#f5c518'); rect(x + 35, y + 2, 12, 8, '#a8e4f2'); rect(x + 35, y + 2, 5, 8, '#d4f5fb'); rect(x + 32, y + 16, 19, 11, '#f5c518')
    for (let i = 0; i < 5; i++) rect(x + 2 + i * 8, y + 1, 7, 8, '#c98a3c')
    for (let i = 0; i < 5; i++) for (const [dx, dy] of [[1, 0], [4, 1], [2, 3], [5, 3]]) { px(x + 2 + i * 8 + dx, y + dy, '#ff9a1f'); px(x + 3 + i * 8 + dx, y + dy, '#ffb347') }
    for (const wx of [x + 8, x + 39]) for (let a = 0; a < 11; a++) for (let b = 0; b < 11; b++) { const d = (a - 5) ** 2 + (b - 5) ** 2; if (d < 27) px(wx + a, y + 22 + b, d < 9 ? '#aab0b6' : '#2b2d33') }
    rect(x + 4, y + 13, 13, 3, '#c98a00')
  }
  truck(-26, 216)
  g = main

  // ───────────── 움직이는 소품 ─────────────
  // 바다 줄무늬와 윤슬
  const STRIPES = [], SPARKS = []
  for (let k = 0; k < 230; k++) { const y = HOR + 2 + ((rnd() * 24) | 0); STRIPES.push({ x: rnd() * W, y, w: 1 + ((rnd() * 5 * (1 + (y - HOR) / 18)) | 0), v: (rnd() < 0.5 ? -1 : 1) * (1 + rnd() * 3 + (y - HOR) * 0.08), c: rnd() < 0.6 ? '#b8f6ee' : '#ffffff' }) }
  for (let k = 0; k < 70; k++) SPARKS.push({ x: (rnd() * W) | 0, y: HOR + 3 + ((rnd() * 21) | 0), ph: rnd() * 6.28, r: 1.4 + rnd() * 2.2 })
  // 갈매기
  const GULLS = [[141, 27, 14], [160, 19, 10], [128, 45, 17], [200, 29, 9], [93, 75, 13], [109, 67, 15], [149, 96, 11], [60, 92, 16]].map(([x, y, v], i) => ({ x, y, v, ph: i * 1.3 }))
  const gullCount = () => (mood.phase === 'night' || mood.rain > 0 || mood.kind === 'fog' || mood.kind === 'snow' ? 0 : mood.kind === 'overcast' ? 3 : mood.phase === 'golden' || mood.phase === 'dusk' || mood.phase === 'dawn' ? 4 : mood.kind === 'partly' ? 6 : 8)
  function drawGull(x, y, up) {
    const c = '#ffffff'
    if (up) { for (let i = 0; i < 4; i++) { px(x + i, y - i * 0.8, c); px(x + 7 - i, y - i * 0.8, c) } px(x + 3.5, y - 2.4, c) }
    else { for (let i = 0; i < 4; i++) { px(x + i, y - (3 - i) * 0.5, c); px(x + 7 - i, y - (3 - i) * 0.5, c) } px(x + 3.5, y, c) }
  }
  // 야자수 (바람에 흔들린다)
  function palm(x0, base, hgt, sw) {
    for (let i = 0; i < hgt; i++) { const x = x0 + Math.sin(i / 14) * 4 + sw * (i / hgt) * 1.6; px(x, base - i, '#9a6a35'); px(x + 1, base - i, '#7a4e22'); px(x + 2, base - i, '#7a4e22'); px(x + 3, base - i, '#5e3a18') }
    const tx = x0 + Math.sin(hgt / 14) * 4 + sw * 1.6 + 1.5, ty = base - hgt
    for (const [dx, dy, dr] of [[-22, 3, 10], [-16, -5, 7], [-8, -10, 4], [0, -12, 0], [8, -10, 4], [16, -5, 7], [22, 3, 10], [-12, 7, 11], [12, 7, 11]]) {
      const n = Math.max(Math.abs(dx), 12), wob = sw * 2.4 * (dx === 0 ? 0.4 : 1)
      for (let i = 0; i <= n; i++) { const t = i / n, x = tx + dx * t + wob * t * t, y = ty + dy * t + dr * t * t + Math.abs(wob) * 0.5 * t * t; px(x, y, i % 3 === 0 ? '#1f7a38' : '#35a850'); px(x, y + 1, '#2a9444'); if (i % 4 === 1) px(x, y + 2, '#2a9444') }
    }
    for (const [x, y] of [[-3, 3], [0, 4], [3, 3]]) rect(tx + x, ty + y, 2, 2, '#7a4a1e')
  }

  // ───────────── 인물 ─────────────
  const OC = mk().getContext('2d', { willReadFrequently: true })
  const SC = 1.28
  function limb(p, q, t0, t1, c, hi, lo) {
    const n = Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])) * 3 + 1
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, th = t0 + (t1 - t0) * t
      rect(x - th / 2, y - th / 2, Math.ceil(th), Math.ceil(th), c)
      if (hi) px(x + th / 2 - 1, y - th / 2, hi)
      if (lo) px(x - th / 2, y + th / 2 - 1, lo)
    }
  }
  function hand(x, y, sk) { rect(x - 1, y - 1, 3, 3, sk); px(x + 2, y - 1, sk); px(x - 1, y - 1, tint(sk, 0.15)) }
  function face(hx, hy, o) {
    const sk = o.skin, skS = warm(sk, 0.2), skL = tint(sk, 0.12)
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if ((x / 5.3) ** 2 + (y / 6.1) ** 2 <= 1) px(hx + x, hy + y, x < -3 ? skS : x > 2 ? skL : (y > 4 ? warm(sk, 0.1) : sk))
    px(hx - 6, hy + 1, sk); px(hx + 6, hy + 1, sk); px(hx - 6, hy + 2, skS); px(hx + 6, hy + 2, skS)
    const look = o.look ?? 0, ey = hy
    for (const sx of [-3, 3]) {
      const ex = hx + sx
      if (o.eye === 'happy') { px(ex - 1, ey + 1, '#3a2a30'); px(ex, ey, '#3a2a30'); px(ex + 1, ey + 1, '#3a2a30') }
      else if (o.eye === 'squint') { rect(ex - 1, ey + 1, 3, 1, '#3a2a30'); px(ex, ey, shade(sk, 0.3)) }
      else { rect(ex - 1, ey, 3, 3, '#ffffff'); rect(ex - 1 + (look > 0 ? 1 : 0), ey, 2, 3, o.iris ?? '#3b2a24'); px(ex - 1 + (look > 0 ? 1 : 0), ey, '#ffffff'); rect(ex - 2, ey - 1, 4, 1, '#2e2229'); px(ex + 1, ey + 2, skL) }
      rect(ex - 1, ey - 4 + (o.brow ?? 0), 3, 1, shade(o.hair ?? '#3a2a24', 0.1))
    }
    px(hx + 1, hy + 3, shade(sk, 0.28)); px(hx + 1, hy + 4, shade(sk, 0.18))
    const blush = mix(sk, '#ff6f86', 0.45); rect(hx - 5, hy + 3, 2, 1, blush); rect(hx + 3, hy + 3, 2, 1, blush)
    const lip = '#c4584f'
    if (o.mouth === 'open') { rect(hx - 2, hy + 5, 5, 2, '#7a2a30'); rect(hx - 2, hy + 5, 5, 1, '#ffffff'); px(hx, hy + 6, '#e86a74'); px(hx - 3, hy + 5, shade(sk, 0.2)); px(hx + 3, hy + 5, shade(sk, 0.2)) }
    else if (o.mouth === 'smile') { px(hx - 2, hy + 5, lip); px(hx - 1, hy + 6, lip); px(hx, hy + 6, lip); px(hx + 1, hy + 6, lip); px(hx + 2, hy + 5, lip) }
    else { px(hx - 1, hy + 5, lip); px(hx, hy + 5, lip); px(hx + 1, hy + 5, lip) }
  }
  function hairCap(hx, hy, o) {
    const c = o.hair, cl = tint(c, 0.3), cd = shade(c, 0.25)
    const paint = (x, y) => px(hx + x, hy + y, y < -5 && x > -1 ? cl : ((x * 3 + y * 5) % 5 === 0) ? cd : (y < -3 && x > 1 ? cl : c))
    for (let y = -8; y <= 0; y++) for (let x = -7; x <= 7; x++) {
      if ((x / 6.5) ** 2 + ((y + 1.5) / 7.2) ** 2 > 1) continue
      const side = o.part ?? -1
      const bangEnd = -3 + (x * side > 2 ? 3 : x * side > -1 ? 1 : 0) + ((x + 7) % 4 === 0 ? 1 : 0)
      if (y <= bangEnd || (Math.abs(x) >= 6 && y <= 1)) paint(x, y)
    }
    if (o.scarf) {
      for (let y = -8; y <= 0; y++) for (let x = -7; x <= 7; x++) if ((x / 6.5) ** 2 + ((y + 1) / 6.6) ** 2 <= 1 && y <= -2) px(hx + x, hy + y, y < -5 ? '#ffffff' : ((x + y) % 4 === 0 ? '#d7dee4' : '#eef2f5'))
      rect(hx - 7, hy - 2, 15, 1, '#c3ccd3'); rect(hx + 6, hy - 1, 4, 2, '#ffffff'); px(hx + 9, hy + 1, '#e6ecf0')
    }
  }
  function backHair(hx, hy, o, wave) {
    const c = shade(o.hair, 0.12)
    if (o.long) o.long.forEach(([dx, dy, len, wid, flow], k) => { for (let i = 0; i < len; i++) for (let j = 0; j < wid; j++) px(hx + dx + i * flow + Math.sin(i * 0.5 + wave + k) * (wave ? i * 0.07 : 0) + j, hy + dy + i, i % 5 === 0 ? tint(c, 0.2) : (i + j) % 4 === 0 ? shade(c, 0.2) : c) })
  }
  function hat(hx, hy) {
    for (let x = -10; x <= 10; x++) { const dy = Math.round(Math.abs(x) * 0.14); rect(hx + x, hy - 6 + dy, 1, 2, x % 3 === 0 ? '#caa24c' : '#e6c06a') }
    for (let y = -12; y <= -6; y++) for (let x = -6; x <= 6; x++) if ((x / 5.8) ** 2 + ((y + 6) / 6.5) ** 2 <= 1) px(hx + x, hy + y, (x + y) % 3 === 0 ? '#e6c06a' : '#f2d68a')
    rect(hx - 6, hy - 8, 13, 2, '#d24a3a'); rect(hx - 6, hy - 8, 13, 1, '#ee6a58')
  }
  function umbrella(hx, hy, c) {
    const top = hy - 22, cl = tint(c, 0.3), cd = shade(c, 0.28)
    for (let y = 0; y < 10; y++) {
      const hw = Math.round(15 * Math.sqrt(1 - ((9 - y) / 10.5) ** 2))
      for (let x = -hw; x <= hw; x++) px(hx + x, top + y, Math.floor((x + 15) / 5) % 2 ? cl : c)
      px(hx - hw, top + y, cd); px(hx + hw, top + y, cd)
    }
    for (let x = -15; x <= 15; x++) if ((x + 15) % 5 < 2) px(hx + x, top + 10, cd)
    px(hx, top - 1, '#c9a050'); px(hx, top - 2, '#c9a050')
    rect(hx, top + 10, 1, 17, '#4a3a2a')
  }
  function person(ox, oy, o0, wave = 0) {
    const sc = (a) => [a[0] * SC, a[1] * SC]
    const o = { ...o0 }
    for (const k of ['hip', 'sh0', 'shF', 'elF', 'haF', 'shB', 'elB', 'haB', 'kneeF', 'footF', 'kneeB', 'footB']) o[k] = sc(o0[k])
    o.head = [o.sh0[0] + (o0.head[0] - o0.sh0[0]), o.sh0[1] + (o0.head[1] - o0.sh0[1])]
    g = main; g.fillStyle = 'rgba(52,62,84,0.32)'
    for (let y = 0; y < 3; y++) g.fillRect(Math.round(ox) - 14 + y * 2 - (o.sh ?? 0), Math.round(oy) + y, 28 - y * 3, 1)
    g = OC
    const bx = Math.max(0, Math.round(ox) - 46), by = Math.max(0, Math.round(oy) - 70), bw = Math.max(1, Math.min(W, Math.round(ox) + 52) - bx), bh = Math.max(1, Math.min(H, Math.round(oy) + 8) - by)
    OC.clearRect(0, 0, W, H)
    const P = (a) => [ox + a[0], oy + a[1]]
    const sk = o.skin, skS = warm(sk, 0.3), top = o.top, topS = shade(o.top, 0.17), topL = tint(o.top, 0.22), bot = o.bottom, botS = shade(o.bottom, 0.22), botL = tint(o.bottom, 0.14)
    const hx = ox + o.head[0], hy = oy + o.head[1]
    backHair(hx, hy, o, wave)
    if (o.umbrella) umbrella(hx, hy, o.umbrella)
    limb(P(o.shB), P(o.elB), 3.6, 3, topS); limb(P(o.elB), P(o.haB), 3, 2.4, skS); hand(ox + o.haB[0], oy + o.haB[1], skS)
    const leg = (kn, ft, front) => {
      const b = front ? bot : botS, s = front ? (o.legs ?? sk) : (o.legs ? shade(o.legs, 0.15) : skS)
      limb(P(o.hip), P(kn), 5.4, 4.4, b, front ? botL : undefined)
      limb(P(kn), P(ft), 4.2, 3.2, o.pants ? b : s, front ? tint(o.pants ? b : s, 0.12) : undefined)
      const fx = ox + ft[0], fy = oy + ft[1]
      rect(fx - 2, fy - 1, 7, 3, o.shoeD ?? '#38343f'); rect(fx - 2, fy - 1, 6, 2, o.shoe ?? '#ffffff'); rect(fx - 2, fy + 1, 7, 1, '#38343f')
    }
    leg(o.kneeB, o.footB, false)
    const sh0 = o.sh0, hp = o.hip
    rect(ox + sh0[0] - 1, oy + sh0[1] - 3, 4, 4, skS)
    for (let y = Math.round(sh0[1]); y <= Math.round(hp[1]) + 1; y++) {
      const t = (y - sh0[1]) / (hp[1] - sh0[1] || 1), xc = sh0[0] + (hp[0] - sh0[0]) * t
      const w = Math.round(10.5 - 2.6 * Math.sin(Math.min(1, t * 1.15) * 2.4) + (t > 0.8 ? 1 : 0))
      for (let x = -Math.floor(w / 2); x <= Math.floor(w / 2); x++) px(ox + xc + x, oy + y, x < -w / 2 + 1.4 ? topS : x > w / 2 - 2 ? topL : ((y + x) % 8 === 0 && t > 0.3 ? topS : top))
    }
    if (o.dress) for (let y = 0; y < o.dress; y++) { const w = 5 + y * 1.1 + (o.flare ?? 0) * y * 0.3; for (let x = -w; x <= w; x++) px(ox + hp[0] + x + (o.dsw ?? 0) * y * 0.3, oy + hp[1] + y, (x + 20) % 4 === 0 ? shade(bot, 0.2) : x > w * 0.45 ? botL : x < -w * 0.5 ? botS : bot); px(ox + hp[0] - w, oy + hp[1] + y, botS) }
    else for (let y = 0; y < 3; y++) for (let x = -5; x <= 5; x++) px(ox + hp[0] + x, oy + hp[1] + y, x < -3 ? botS : x > 3 ? botL : bot)
    leg(o.kneeF, o.footF, true)
    face(hx, hy, o); hairCap(hx, hy, o)
    if (o.hat) hat(hx, hy)
    limb(P(o.shF), P(o.elF), 3.6, 3, top, tint(top, 0.2)); limb(P(o.elF), P(o.haF), 3, 2.4, sk, tint(sk, 0.15)); hand(ox + o.haF[0], oy + o.haF[1], sk)
    if (o.extra) o.extra(ox, oy, o)
    const id = OC.getImageData(bx, by, bw, bh), d = id.data, out = new Uint8ClampedArray(d)
    const A = (x, y) => (x < 0 || y < 0 || x >= bw || y >= bh ? 0 : d[(y * bw + x) * 4 + 3])
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      if (A(x, y) > 0) continue
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (A(x + dx, y + dy) > 0) {
        const i = ((y + dy) * bw + (x + dx)) * 4, k = (y * bw + x) * 4
        out[k] = d[i] * 0.42 + 36 * 0.58; out[k + 1] = d[i + 1] * 0.42 + 26 * 0.58; out[k + 2] = d[i + 2] * 0.42 + 40 * 0.58; out[k + 3] = 255; break
      }
    }
    OC.putImageData(new ImageData(out, bw, bh), bx, by)
    person.region = [bx, by, bw, bh]
  }
  // 인물이 쓰는 관절 값 (시간 t 에 따라 움직인다)
  const blink = (t, ph) => ((t + ph) % 3.6) < 0.16
  function manAt(t) {
    const b = Math.sin(t * 2) * 0.5, wv = Math.sin(t * 3.2)
    return { umbrella: mood.rain > 0 ? '#3b82d8' : null, skin: '#eebd92', hair: '#2a2118', top: '#fbfbf4', bottom: '#d9e3ea', hat: true, eye: blink(t, 0.4) ? 'happy' : 'squint', mouth: 'smile', brow: 1, sh: 1, part: 1,
      hip: [1, -15 + b * 0.3], sh0: [1, -24 + b * 0.4], head: [1 + Math.sin(t * 1.4) * 0.5, -31 + b * 0.4], shF: [7, -24 + b * 0.4], elF: [13 + wv * 0.6, -29 + wv * 1], haF: [8 + wv * 0.8, -37 + wv * 1.2], shB: [-5, -23 + b * 0.4], elB: [-9, -17], haB: [-9, -10],
      kneeF: [3, -8], footF: [4, 0], kneeB: [-2, -8], footB: [-4, -1] }
  }
  function pumpAt(t) {
    const p = (Math.sin(t * 4.2) + 1) / 2, b = Math.sin(t * 2) * 0.3
    return { umbrella: mood.rain > 0 ? '#ffd93b' : null, skin: '#f6cfa9', hair: '#d9a03e', top: '#e8557f', bottom: '#2e4a96', eye: blink(t, 1.7) ? 'happy' : 'open', look: 1, mouth: 'soft', sh: 2, part: -1,
      long: [[-8, -3, 16, 4, -0.1], [4, -3, 14, 4, 0.05], [-5, 0, 18, 3, -0.15]],
      hip: [-4, -11], sh0: [2, -22 + p * 0.8], head: [8, -28 + p * 0.8 + b], shF: [6, -21 + p * 0.8], elF: [12, -14 + p * 1.5], haF: [17, -8 + p * 3], shB: [0, -21 + p * 0.8], elB: [7, -13 + p * 1.5], haB: [16, -7 + p * 3],
      kneeF: [7, -10], footF: [7, 0], kneeB: [4, -8], footB: [2, 0], pp: p,
      extra: (ox, oy, o) => { const h = o.haF; rect(ox + h[0] - 2, oy - 3, 7, 3, '#ff6fa0'); rect(ox + h[0], oy + h[1] + 1, 3, Math.max(1, -3 - (h[1] + 1)), '#ff9fbf'); rect(ox + h[0] - 1, oy + h[1] - 1, 5, 2, '#444') } }
  }
  function haenyeoAt(t) {
    const br = Math.sin(t * 1.8) * 0.4, sway = Math.sin(t * 1.1)
    return { skin: '#e2ae82', hair: '#1c1c22', top: '#262a35', bottom: '#262a35', legs: '#262a35', pants: true, shoe: '#262a35', shoeD: '#15161c', scarf: true, eye: blink(t, 2.4) ? 'happy' : 'open', mouth: 'smile', sh: 1,
      hip: [0, -15], sh0: [0, -24 + br], head: [1 + sway * 0.4, -31 + br], shF: [6, -24 + br], elF: [11, -18 + br * 0.5], haF: [13, -11], shB: [-6, -24 + br], elB: [-10, -18], haB: [-6, -14],
      kneeF: [3, -8], footF: [5, 0], kneeB: [-3, -8], footB: [-5, -1] }
  }
  function runnerAt(t, ph) {
    // 달리기: 다리·팔이 번갈아 휘두르고 몸이 위아래로 튄다
    const leg = (a) => { const s = Math.sin(a), lift = Math.max(0, Math.cos(a)); return { foot: [9 * s, -lift * 6], knee: [s * 5 + lift * 3, -8 - lift * 3] } }
    const A = leg(ph), B = leg(ph + Math.PI)
    const bob = -Math.abs(Math.sin(ph)) * 1.4
    const arm = (a, sh) => [[sh[0] + 5 + 4 * Math.sin(a), -19 + 2 * Math.cos(a)], [sh[0] + 7 + 8 * Math.sin(a), -22 + 5 * Math.cos(a) - 2]]
    const aB = arm(ph, [-3, -24])
    // 바구니를 든 앞쪽 팔: 팔꿈치를 굽힌 채 몸 옆에서 작게 흔들고, 바구니는 손잡이에 걸려 매달린다
    const sw = Math.sin(ph + Math.PI), cw = Math.cos(ph + Math.PI)
    const aF = [[11 + 2 * sw, -19 + cw], [13 + 4 * sw, -14 + 1.5 * cw]]
    return { umbrella: mood.rain > 0 ? '#e8557f' : null, skin: '#f3c9a0', hair: '#7a4222', top: '#ffd93b', bottom: '#2d9a72', dress: 9, flare: 1, dsw: -0.4, eye: 'open', look: 1, mouth: 'open', sh: -2, part: 1, shoe: '#e8e8e8',
      long: [[-9, -4, 24, 5, -0.5], [-8, -2, 22, 4, -0.45], [4, -3, 10, 3, -0.2]],
      hip: [0, -15 + bob], sh0: [2, -24 + bob], head: [4, -31 + bob], shF: [7, -23 + bob], elF: aF[0], haF: aF[1], shB: [-3, -24 + bob], elB: aB[0], haB: aB[1],
      kneeF: A.knee, footF: A.foot, kneeB: B.knee, footB: B.foot, ph0: ph,
      extra: (ox, oy, o) => {
        // 바구니: 손에 쥔 손잡이에서 아래로 늘어져 걸음에 맞춰 앞뒤로 흔들린다 (손보다 조금 늦게 따라 움직임)
        const h = o.haF, th = 0.6 * Math.sin(o.ph0 - 0.9) + 0.05, hx0 = ox + h[0], hy0 = oy + h[1] + 1
        const cx = hx0 + Math.sin(th) * 10, cy = hy0 + Math.cos(th) * 10, bx = Math.round(cx - 6), by = Math.round(cy - 3)
        limb([hx0, hy0], [bx + 1, by], 1, 1, '#8a5a2b'); limb([hx0, hy0], [bx + 12, by], 1, 1, '#8a5a2b')
        for (let k = 0; k < 5; k++) { rect(bx + 1 + k * 2.4, by - 2 + (k % 2), 3, 3, '#ff9a1f'); px(bx + 1 + k * 2.4, by - 2 + (k % 2), '#ffc060') }
        rect(bx, by, 13, 8, '#b07a38'); rect(bx, by, 13, 2, '#d09a58'); rect(bx, by + 6, 13, 2, '#8a5a2b'); for (let k = 1; k < 13; k += 3) px(bx + k, by + 3, '#946528')
        hand(hx0, hy0 - 1, o.skin)
      } }
  }

  // ───────────── 한 프레임 그리기 ─────────────
  function frame(t) {
    g = main
    main.drawImage(SKYL, 0, 0)
    for (const c of CLOUDS) { const w = c.s.width, x = (((c.x0 + t * c.v) % (W + w)) + (W + w)) % (W + w) - w; main.drawImage(c.s, Math.round(x), c.y) }
    for (const gl of GULLS.slice(0, gullCount())) { const x = (((gl.x + t * gl.v) % (W + 20)) + W + 20) % (W + 20) - 10; drawGull(x, gl.y + Math.sin(t * 1.3 + gl.ph) * 2, Math.sin(t * 7 + gl.ph) > 0) }
    main.drawImage(FA, 0, 0)
    for (const s of STRIPES) { const x = (((s.x + t * s.v * (0.7 + 0.4 * windK())) % W) + W) % W; rect(x, s.y, s.w, 1, s.c) }
    for (const s of SPARKS) { const v = Math.sin(t * s.r + s.ph); if (v > 0.55) { px(s.x, s.y, '#ffffff'); if (v > 0.8) { px(s.x - 1, s.y, '#e8fffb'); px(s.x + 1, s.y, '#e8fffb'); px(s.x, s.y - 1, '#e8fffb'); px(s.x, s.y + 1, '#e8fffb') } } }
    if (mood.sunX != null && mood.phase !== 'day') for (let k = 0; k < 12; k++) { const w = 2 + (k % 3) * 3; rect(mood.sunX - w / 2 + Math.sin(t * 2 + k) * (3 + k * 0.5), HOR + 2 + k * 1.7, w, 1, mood.phase === 'dusk' ? '#ff9a6a' : '#ffe3a0') }
    palm(160, 204, 45, (Math.sin(t * (1.1 + windK() * 0.5)) + Math.sin(t * 2.7) * 0.4) * windK())
    main.drawImage(FB, 0, 0)
    // 길 위의 사람들 (오른쪽→왼쪽 깊이 순서)
    const whole = (p, ox, oy, o, wv) => { person(ox, oy, o, wv); const [bx, by, bw, bh] = person.region; main.drawImage(OC.canvas, bx, by, bw, bh, bx, by, bw, bh); g = main }
    whole(0, 46, 246, manAt(t), 0)
    const pu = pumpAt(t)
    whole(0, 98, 248, pu, 0)
    // 튜브: 바람이 들어가며 조금씩 부푼다
    const grow = 0.9 + 0.1 * (0.5 + 0.5 * Math.sin(t * 0.7)), R = 12 * grow
    for (let a = 0; a < 28; a++) for (let b = 0; b < 28; b++) { const d2 = Math.hypot(a - 14, (b - 14) * 1.04); if (d2 < R && d2 > R * 0.5) px(120 + a, 225 + b, (a + b) % 9 < 3 ? '#ffffff' : d2 > R * 0.8 ? '#2a76d0' : '#4aa0f0') }
    const bobT = Math.sin(t * 1.7) * 1.3
    whole(0, 152, 250, haenyeoAt(t), 0)
    // 테왁: 물 위 부표처럼 살짝 흔들린다
    for (let a = -10; a <= 10; a++) for (let b = -10; b <= 10; b++) { const d2 = Math.hypot(a, b); if (d2 <= 10) px(176 + a, 238 + b + bobT * 0.4, d2 > 9 ? '#8a3512' : b > 4 ? '#b8431b' : ((a + b) % 6 === 0 || (a - b) % 6 === 0) ? '#ffb064' : (d2 < 5 && a < 2 && b < 0) ? '#ffd9a8' : '#ff8a3d') }
    rect(166, 248, 22, 1, '#7a2f10')
    // 달리는 소녀: 길을 가로질러 달렸다가 잠깐 쉬었다 다시 온다
    const cyc = 9, u = (t % cyc) / cyc, rx = -40 + Math.min(1, u / 0.78) * 330
    if (rx < 300) whole(0, rx, 252, runnerAt(t, t * 11), t * 6)
    // 비·눈
    if (drops.length) {
      const dt = Math.min(0.1, Math.max(0, t - (frame.last ?? t))), snow = mood.kind === 'snow', slant = 0.2 + windK() * 0.12
      for (const d of drops) {
        d.y += d.v * dt; d.x += snow ? Math.sin(t * 1.5 + d.ph) * 0.3 - slant * 8 * dt : -d.v * dt * slant
        if (d.y >= d.land) {
          if (!snow) { const sy = Math.round(d.land); px(d.x - 1, sy, '#cfe6ff'); px(d.x + 1, sy, '#cfe6ff'); px(d.x, sy - 1, '#eaf4ff') }
          d.y = -Math.random() * 40; d.x = Math.random() * (W + 60) - 10; d.land = HOR + 8 + Math.random() * (H - HOR - 10)
        }
        if (snow) { px(d.x, d.y, '#ffffff'); px(d.x + 1, d.y, '#eaf2ff'); px(d.x, d.y + 1, '#eaf2ff') }
        else { px(d.x, d.y, '#dcefff'); px(d.x + slant, d.y - 1, '#b4d4f0'); px(d.x + slant * 2, d.y - 2, '#8fb6dc') }
      }
    }
    frame.last = t
    // 빛줄기와 날씨·시간대 색 보정
    const img = main.getImageData(0, 0, W, H), dd = img.data
    const G = grade, shift = t * 7
    const flash = mood.kind === 'storm' && (t * 0.9) % 7 < 0.12 ? 70 : 0
    const hz = G.haze
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      let r = dd[i], gg = dd[i + 1], b = dd[i + 2]
      if (G.ray > 0.02) {
        const u2 = ((x * 0.55 + y - shift) % 93 + 93) % 93
        let f = u2 < 12 ? 0.24 : u2 < 21 ? 0.11 : u2 > 45 && u2 < 50 ? 0.09 : 0
        if (y > HOR - 8 && y < 219) f *= 0.7
        f *= (0.6 + 0.6 * (x / W) * (1 - (y / H) * 0.5)) * G.ray
        if (y > 214) f *= 0.8
        if (G.glare > 0 && y < 80 && x >= 160) { const q = Math.hypot(x - 256, y) / 120; if (q < 1) f += (1 - q) * (0.3 + 0.06 * Math.sin(t * 0.9)) * G.glare }
        if (f > 0.02) { r += (255 - r) * f; gg += (255 - gg) * f; b += (255 - b) * f }
      }
      if (G.desat) { const l = r * 0.3 + gg * 0.59 + b * 0.11; r += (l - r) * G.desat; gg += (l - gg) * G.desat; b += (l - b) * G.desat }
      if (hz) { const k = hz * (1 - Math.abs(y - HOR) / 200); r += (214 - r) * k; gg += (220 - gg) * k; b += (226 - b) * k }
      dd[i] = Math.max(0, Math.min(255, r * G.mul[0] + G.add[0] + flash)); dd[i + 1] = Math.max(0, Math.min(255, gg * G.mul[1] + G.add[1] + flash)); dd[i + 2] = Math.max(0, Math.min(255, b * G.mul[2] + G.add[2] + flash))
    }
    main.putImageData(img, 0, 0)
  }

  // ───────────── 분위기 바꾸기 ─────────────
  let drops = []
  let grade = { mul: [1, 1, 1], add: [0, 0, 0], desat: 0, haze: 0, ray: 1, glare: 1 }
  function gradeOf() {
    const G = { mul: [1, 1, 1], add: [0, 0, 0], desat: 0, haze: 0, ray: 1, glare: 1 }
    const ph = { golden: { mul: [1.08, 0.95, 0.84], add: [14, 6, -6], ray: 1.1, glare: 0 }, dawn: { mul: [1.02, 0.93, 1.04], add: [10, 0, 10], ray: 0.9, glare: 0 }, dusk: { mul: [0.9, 0.78, 0.86], add: [18, 0, -2], ray: 0.7, glare: 0 }, night: { mul: [0.42, 0.5, 0.82], add: [0, 4, 14], ray: 0, glare: 0 } }[mood.phase]
    if (ph) Object.assign(G, { ...ph, mul: [...ph.mul], add: [...ph.add] })
    const by = { partly: { ray: 0.8 }, overcast: { desat: 0.35, mulK: 0.92, ray: 0.25, glare: 0.2 }, fog: { desat: 0.5, haze: 0.32, ray: 0.3, glare: 0.3 }, drizzle: { desat: 0.4, mulK: 0.88, ray: 0.1, glare: 0 }, rain: { desat: 0.5, mulK: 0.8, ray: 0, glare: 0 }, storm: { desat: 0.6, mulK: 0.62, ray: 0, glare: 0 }, snow: { desat: 0.4, mulK: 0.97, haze: 0.15, ray: 0.2, glare: 0.1 } }[mood.kind]
    if (by) { G.desat = by.desat ?? 0; if (by.mulK) G.mul = G.mul.map((v) => v * by.mulK); G.haze = by.haze ?? 0; G.ray = Math.min(G.ray, by.ray ?? 1); G.glare = Math.min(G.glare, by.glare ?? 1) }
    if (mood.kind === 'rain' || mood.kind === 'storm') G.mul = [G.mul[0] * 0.95, G.mul[1], G.mul[2] * 1.05]
    return G
  }
  function initPrecip() {
    const n = mood.kind === 'storm' ? 230 : mood.kind === 'rain' ? (mood.heavy ? 200 : 120) : mood.kind === 'drizzle' ? 55 : mood.kind === 'snow' ? 90 : 0
    drops = Array.from({ length: n }, () => ({ x: Math.random() * (W + 50) - 20, y: Math.random() * H, v: mood.kind === 'snow' ? 16 + Math.random() * 18 : 150 + Math.random() * 90, land: HOR + 8 + Math.random() * (H - HOR - 10), ph: Math.random() * 6.28 }))
  }
  function setMood(m) {
    mood = { kind: 'clear', phase: 'day', wind: 2, heavy: false, ...m }
    mood.rain = { drizzle: 0.3, rain: mood.heavy ? 1 : 0.65, storm: 1 }[mood.kind] ?? 0
    mood.sunX = mood.kind === 'clear' || mood.kind === 'partly' ? ({ golden: 188, dusk: 188, dawn: 38 })[mood.phase] ?? null : null
    grade = gradeOf()
    buildSky(); buildClouds(); initPrecip()
  }
  setMood({})

  return { frame, setMood }
}
