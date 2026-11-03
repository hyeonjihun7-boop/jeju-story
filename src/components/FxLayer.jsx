import { useEffect, useRef } from 'react'
import { drawAvatar } from '../lib/avatar'
import { useFxStore } from '../store/useFxStore'

// 스탬프를 찍을 때 도장이 쾅 찍히고 감귤이 터지는 연출, 레벨업·코스 완주는 더 크게.
// 낮은 해상도 캔버스에 도트로 그려 크게 늘려 보이고, "움직임 줄이기" 설정이면 글자만 잠깐 보여 준다.
const DUR = { stamp: 1.9, levelup: 3.0, badge: 2.6 }
const C = { orange: '#ff9a1f', orangeL: '#ffb347', orangeD: '#8a3a0c', leaf: '#3fa650', spark: '#fff7c2', ring: '#ffd08a' }

function sealSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 23
  const g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1) }
  for (let y = 0; y < 23; y++) for (let x = 0; x < 23; x++) {
    const d = Math.hypot(x - 11, y - 11), r = 10 + (Math.floor((Math.atan2(y - 11, x - 11) * 7) / Math.PI) & 1 ? 0.9 : 0)
    if (d <= r) px(x, y, d > 8.4 ? '#c4580a' : d > 7.2 ? C.ring : C.orange)
  }
  for (const [x, y] of [[6, 11], [7, 12], [8, 13], [9, 14], [10, 15], [11, 14], [12, 13], [13, 12], [14, 11], [15, 10], [16, 9], [17, 8]]) { px(x, y, '#1d4a3a'); px(x, y + 1, '#1d4a3a'); px(x + 1, y, '#1d4a3a') }
  for (const [x, y] of [[5, 6], [6, 5], [7, 5], [5, 7]]) px(x, y, '#ffe9bd')
  return c
}
function medalSprite() {
  const c = document.createElement('canvas'); c.width = 26; c.height = 30
  const g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1) }
  for (let y = 17; y < 30; y++) for (let x = 0; x < 26; x++) { const l = Math.abs(x - 8 - (y - 17) * 0.1) < 4.2 && y < 30 - Math.abs(x - 8) * 0.6, r = Math.abs(x - 18 + (y - 17) * 0.1) < 4.2 && y < 30 - Math.abs(x - 18) * 0.6; if (l) px(x, y, '#e8557f'); else if (r) px(x, y, '#2f7d6f') }
  for (let y = 0; y < 22; y++) for (let x = 0; x < 26; x++) {
    const d = Math.hypot(x - 13, y - 11)
    if (d <= 11) px(x, y, d > 9.2 ? '#c98a0a' : d > 7.6 ? '#ffe98a' : '#ffcf3a')
  }
  for (const [x, y] of [[13, 5], [12, 7], [14, 7], [10, 9], [16, 9], [9, 10], [17, 10], [11, 13], [15, 13], [12, 12], [14, 12], [13, 9], [13, 10], [12, 10], [14, 10]]) px(x, y, '#c4580a')
  for (const [x, y] of [[6, 5], [7, 4], [8, 4]]) px(x, y, '#fff7c2')
  return c
}
const orange = (g, x, y) => { g.fillStyle = C.orangeD; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 4, 4); g.fillStyle = C.orange; g.fillRect(Math.round(x), Math.round(y), 2, 2); g.fillStyle = C.orangeL; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.fillStyle = C.leaf; g.fillRect(Math.round(x) + 1, Math.round(y) - 2, 2, 1) }
const spark = (g, x, y, col = C.spark) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1) }

export default function FxLayer() {
  const fx = useFxStore((s) => s.fx)
  const seq = useFxStore((s) => s.seq)
  const ref = useRef(null)
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!fx) return undefined
    const dur = DUR[fx.kind] ?? 2
    const timer = setTimeout(() => useFxStore.getState().clear(seq), dur * 1000)
    const canvas = ref.current
    if (!canvas || reduce) return () => clearTimeout(timer)
    const LW = window.innerWidth > window.innerHeight * 1.2 ? 176 : 128, LH = Math.max(64, Math.round(LW * (window.innerHeight / window.innerWidth)))
    canvas.width = LW; canvas.height = LH
    const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false
    const seal = sealSprite(), medal = medalSprite()
    const cx = LW / 2, cy = LH * 0.4
    const parts = []
    const burst = (n, speed, kinds) => { for (let i = 0; i < n; i++) { const a = -Math.PI * (0.05 + Math.random() * 0.9), v = speed * (0.45 + Math.random() * 0.7); parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.1 + Math.random() * 0.7, kind: kinds[i % kinds.length], age: 0 }) } }
    let raf = 0, burst1 = false, burst2 = false, last = 0
    const start = performance.now()
    const loop = (now) => {
      const t = (now - start) / 1000, dt = Math.min(0.05, t - last); last = t
      g.clearRect(0, 0, LW, LH)
      let shakeX = 0, shakeY = 0
      if (fx.kind === 'stamp') {
        const k = t < 0.1 ? 3 : t < 0.22 ? 2 : 1
        if (t >= 0.22 && !burst1) { burst1 = true; burst(16, 70, ['o', 'o', 's']) }
        if (t >= 0.22 && t < 0.5) { shakeX = (Math.random() - 0.5) * 6; shakeY = (Math.random() - 0.5) * 6 }
        if (t >= 0.22) { const r = (t - 0.22) * 70; if (r < 34) { g.strokeStyle = C.ring; g.globalAlpha = 1 - r / 34; g.lineWidth = 1; g.beginPath(); g.arc(cx + 0.5, cy + 0.5, r, 0, 6.3); g.stroke(); g.globalAlpha = 1 } }
        const fade = t > DUR.stamp - 0.4 ? Math.max(0, (DUR.stamp - t) / 0.4) : 1
        g.globalAlpha = fade; g.drawImage(seal, Math.round(cx - 11.5 * k), Math.round(cy - 11.5 * k), 23 * k, 23 * k); g.globalAlpha = 1
      } else if (fx.kind === 'badge') {
        const k = t < 0.12 ? 3 : t < 0.26 ? 2 : 1
        if (t >= 0.26 && !burst1) { burst1 = true; burst(22, 80, ['o', 's', 's']) }
        if (t >= 0.26 && t < 0.5) { shakeX = (Math.random() - 0.5) * 5; shakeY = (Math.random() - 0.5) * 5 }
        const fade = t > DUR.badge - 0.4 ? Math.max(0, (DUR.badge - t) / 0.4) : 1
        g.globalAlpha = fade; g.drawImage(medal, Math.round(cx - 13 * k), Math.round(cy - 15 * k), 26 * k, 30 * k)
        if (t > 0.4) for (let i = 0; i < 6; i++) { const a = t * 2.2 + (i * Math.PI) / 3; if (Math.sin(t * 7 + i * 2) > -0.2) spark(g, cx + Math.cos(a) * 24, cy + Math.sin(a) * 18) }
        g.globalAlpha = 1
      } else { // levelup
        if (t < 0.9 && Math.floor(t * 30) % 3 === 0) for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.28 + t * 2; spark(g, cx + Math.cos(a) * (10 + t * 55), cy + Math.sin(a) * (8 + t * 40), '#ffe9a0') }
        if (!burst1 && t > 0.72) { burst1 = true; burst(24, 80, ['o', 's']) }
        if (!burst2 && t > 1.8) { burst2 = true; burst(18, 70, ['o', 's', 'o']) }
        // 이전 모습으로 서 있다가 번쩍하고 새 모습으로 바뀌어 깡충 뛴다 (진화)
        const lvNew = fx.level ?? 1, lvOld = Math.max(0, lvNew - 1), evolved = t >= 0.7
        const jumping = t > 0.9 && t < 2.5, jy = jumping ? Math.abs(Math.sin((t - 0.9) * 5.2)) * 12 : 0
        g.globalAlpha = t > DUR.levelup - 0.4 ? Math.max(0, (DUR.levelup - t) / 0.4) : 1
        drawAvatar(g, Math.round(cx - 4 + (evolved ? 0 : (Math.random() - 0.5) * 2 * Math.min(1, t / 0.6))), Math.round(LH * 0.68), evolved ? lvNew : lvOld, t, jy)
        g.globalAlpha = 1
        if (t > 0.5 && t < 0.95) { g.fillStyle = 'rgba(255,255,255,' + (1 - Math.abs(t - 0.72) / 0.23).toFixed(2) + ')'; g.fillRect(0, 0, LW, LH) }
      }
      for (const p of parts) {
        p.age += dt; if (p.age > p.life) continue
        p.vy += 130 * dt; p.x += p.vx * dt; p.y += p.vy * dt
        g.globalAlpha = Math.min(1, (p.life - p.age) * 2)
        if (p.kind === 'o') orange(g, p.x, p.y); else spark(g, p.x, p.y)
        g.globalAlpha = 1
      }
      canvas.style.transform = shakeX || shakeY ? `translate(${shakeX * 3}px, ${shakeY * 3}px)` : ''
      if (t < dur) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); canvas.style.transform = '' }
  }, [fx, seq, reduce])

  if (!fx) return null
  return (
    <div className={`fx fx-${fx.kind}`} key={seq} aria-live="polite">
      {!reduce && <canvas ref={ref} aria-hidden="true" />}
      <div className="fx-label">
        <b>{fx.title}</b>
        {fx.sub && <span>{fx.sub}</span>}
      </div>
    </div>
  )
}
