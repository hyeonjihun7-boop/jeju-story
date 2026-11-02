// 오늘의 추천: 날짜(한국시간)를 씨앗으로 매일 다른 장소를 고른다. 같은 날에는 누구에게나 같은 추천.
import { getIndoorAll } from './indoor.js'
import { getOutdoorAll } from './outdoor.js'

export const kstDate = (now = Date.now()) => new Date(now + 9 * 3600e3).toISOString().slice(0, 10)

// 문자열 → 숫자 씨앗 → 재현 가능한 난수 (mulberry32)
function rng(seedStr) {
  let h = 2166136261
  for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(list, rand) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// 분류가 골고루 섞이도록 분류별로 돌아가며 뽑는다
function pickBalanced(pool, n, rand) {
  const groups = new Map()
  for (const p of shuffle(pool, rand)) (groups.get(p.kind) ?? groups.set(p.kind, []).get(p.kind)).push(p)
  const order = shuffle([...groups.keys()], rand)
  const out = []
  while (out.length < n && order.some((k) => groups.get(k).length)) {
    for (const k of order) { const g = groups.get(k); if (g.length && out.length < n) out.push(g.shift()) }
  }
  return out
}

const SKIP = { indoor: ['기타'], outdoor: ['유적·사찰', '기타'] }

export async function getDailyPicks({ mode = 'indoor', n = 6, date = kstDate() } = {}) {
  const all = await (mode === 'indoor' ? getIndoorAll() : getOutdoorAll())
  const pool = all.filter((p) => p.image && Number.isFinite(p.lat) && !SKIP[mode].includes(p.kind))
  return { date, mode, items: pickBalanced(pool, n, rng(`${date}:${mode}`)), poolSize: pool.length }
}
