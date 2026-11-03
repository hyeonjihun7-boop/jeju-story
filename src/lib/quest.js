import { KINDS } from '../data/spots'

// 두 좌표 사이 거리(m) — 하버사인
export function distanceM(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const fmtDist = (m) => (m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`)

// 한국 날짜(yyyy-mm-dd) — 자정이 지나면 미션이 바뀐다
export const dayKey = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10)
export const isToday = (iso) => dayKey(new Date(iso)) === dayKey()

// 현재 위치 (허용·실패를 한글 메시지로)
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('이 기기에서는 위치를 확인할 수 없어요'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => reject(new Error(e.code === 1 ? '위치 사용을 허용해 주세요' : '현재 위치를 찾지 못했어요')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    )
  })
}

// ── 레벨: 스탬프 수에 따라 ──
const LEVELS = [
  { at: 0, name: '육지 손님' }, { at: 1, name: '제주 새내기' }, { at: 3, name: '탐험 수습생' },
  { at: 6, name: '제주 탐험가' }, { at: 10, name: '제주 길잡이' }, { at: 15, name: '탐험 대장' },
]
export function levelOf(count) {
  let i = 0
  LEVELS.forEach((l, k) => { if (count >= l.at) i = k })
  const next = LEVELS[i + 1]
  return { index: i, name: LEVELS[i].name, next: next?.name ?? null, need: next ? next.at - count : 0, from: LEVELS[i].at, to: next?.at ?? LEVELS[i].at }
}

// ── 종류별 칭호 (1·3·5곳) ──
const TITLES = {
  oreum: ['오름 초보', '오름 탐험가', '오름 마스터'],
  sea: ['바다 초보', '해안 탐험가', '바다 마스터'],
  history: ['기억 지킴이', '역사 탐방가', '역사 마스터'],
  food: ['맛 초보', '맛 탐험가', '맛 마스터'],
  nature: ['숲 초보', '폭포 탐험가', '숲 마스터'],
}
const TIERS = [1, 3, 5]
export function badgesOf(stamps) {
  return Object.keys(KINDS).map((kind) => {
    const n = stamps.filter((s) => s.kind === kind).length
    const tier = TIERS.filter((t) => n >= t).length // 0~3
    return { kind, n, tier, title: tier ? TITLES[kind][tier - 1] : null, next: TIERS[tier] ?? null, nextTitle: TITLES[kind][tier] ?? null }
  })
}

// ── 오늘의 미션: 날씨로 하나, 나머지는 기록 남기기 ──
const seedOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const pickBy = (list, seed) => list[seed % list.length]

export function dailyMissions({ today, spots, stamps, journal, courses }) {
  const key = dayKey()
  const seed = seedOf(key)
  const out = today?.mode?.mode === 'indoor'
  const desc = today?.weather?.now?.desc
  const temp = today?.weather?.now?.temp
  const stampedIds = new Set(stamps.map((s) => s.spotId))
  const stampedToday = stamps.filter((s) => isToday(s.at))

  // 1) 날씨 미션
  let main
  if (out) {
    const pool = spots.filter((s) => s.kind === 'food' || s.kind === 'history')
    const target = pickBy(pool.length ? pool : spots, seed)
    main = {
      id: 'weather', icon: 'umbrella', title: `${desc ?? '궂은 날씨'} — 실내 가까운 곳 도전`,
      detail: `${today.mode.reason}. 오늘은 ${target.name}에서 스탬프를 찍어 보세요.`,
      target, done: stampedToday.some((s) => s.spotId === target.id),
    }
  } else {
    const kinds = ['oreum', 'sea']
    const kind = kinds[seed % kinds.length]
    const pool = spots.filter((s) => s.kind === kind)
    const notYet = pool.filter((s) => !stampedIds.has(s.id))
    const target = pickBy(notYet.length ? notYet : pool, seed >> 3)
    main = {
      id: 'weather', icon: kind === 'oreum' ? 'brightness-high' : 'water',
      title: `${desc ?? '맑은 날'}${temp != null ? ` ${Math.round(temp)}°` : ''} — ${kind === 'oreum' ? '오름' : '바다'} 도전`,
      detail: `${today?.mode?.reason ?? '오늘은 야외 탐험하기 좋은 날'}. 오늘의 목적지는 ${target.name}!`,
      target, done: stampedToday.some((s) => s.spotId === target.id),
    }
  }
  const list = [
    main,
    { id: 'journal', icon: 'journal-text', title: '오늘의 한 줄 일지', detail: '탐험 일지에 오늘 본 것을 한 줄 남겨 보세요.', tab: 'journal', done: journal.some((j) => isToday(j.at)) },
    { id: 'course', icon: 'signpost-split', title: '나만의 탐험 코스 만들기', detail: '핀을 골라 코스를 만들고 링크로 공유해 보세요.', tab: 'course', done: courses.some((c) => isToday(c.at)) },
  ]
  return { key, list, doneCount: list.filter((m) => m.done).length }
}

// ── 연속 탐험일: 스탬프나 일지를 남긴 날(한국 날짜)이 이어진 일수. 오늘 아직 안 했어도 어제까지 이어졌으면 유지 ──
const STREAK_TITLES = [{ at: 3, name: '사흘 탐험가' }, { at: 7, name: '일주일 탐험가' }, { at: 14, name: '열나흘 탐험대장' }]
const shiftDay = (key, d) => dayKey(new Date(new Date(`${key}T12:00:00Z`).getTime() + d * 86400e3))

export function streakOf(stamps, journal) {
  const days = new Set([...stamps, ...journal].filter((x) => x.at).map((x) => dayKey(new Date(x.at))))
  let cur = dayKey()
  if (!days.has(cur)) cur = shiftDay(cur, -1)
  let now = 0
  while (days.has(cur)) { now++; cur = shiftDay(cur, -1) }
  let best = 0, run = 0, prev = null
  for (const k of [...days].sort()) { run = prev && shiftDay(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k }
  const earned = [...STREAK_TITLES].reverse().find((t) => best >= t.at)
  const next = STREAK_TITLES.find((t) => now < t.at)
  return { days: now, best, title: earned?.name ?? null, next: next?.name ?? null, need: next ? next.at - now : 0, activeToday: days.has(dayKey()) }
}
