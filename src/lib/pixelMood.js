// 오늘의 날씨와 한국 시각으로 도트 풍경의 분위기(mood)를 정한다.
// kind: clear · partly · overcast · fog · drizzle · rain · storm · snow
// phase: night · dawn · day · golden(해 질 무렵) · dusk(노을)
const kindOf = (c) => {
  if (c == null || c <= 1) return 'clear'
  if (c === 2) return 'partly'
  if (c === 3) return 'overcast'
  if (c === 45 || c === 48) return 'fog'
  if (c >= 51 && c <= 57) return 'drizzle'
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return 'rain'
  if (c >= 95) return 'storm'
  if (c >= 71 && c <= 77) return 'snow'
  return 'partly'
}
const hm = (s, d) => { const m = /^(\d{1,2}):(\d{2})/.exec(s ?? ''); return m ? +m[1] + +m[2] / 60 : d }

export function moodOf(today, now = new Date()) {
  const w = today?.weather
  const code = w?.now?.code
  const kst = new Date(now.getTime() + 9 * 3600e3)
  const h = kst.getUTCHours() + kst.getUTCMinutes() / 60
  const sr = hm(w?.today?.sunrise, 6.5), ss = hm(w?.today?.sunset, 18.5)
  let phase = 'day'
  if (h < sr - 0.8 || h >= ss + 0.9) phase = 'night'
  else if (h < sr + 0.6) phase = 'dawn'
  else if (h < ss - 1.3) phase = 'day'
  else if (h < ss + 0.1) phase = 'golden'
  else phase = 'dusk'
  const kind = kindOf(code)
  return { kind, phase, wind: w?.now?.wind ?? 2, heavy: code === 65 || code === 67 || code === 82 || code === 81, code: code ?? 0 }
}

// 확인용: 주소 끝에 ?pixel=rain,night,wind9 처럼 붙이면 날씨·시간대를 강제로 바꿔 볼 수 있다
export function overrideMood(search, base) {
  const raw = new URLSearchParams(search).get('pixel')
  if (!raw) return base
  const out = { ...base }
  for (const tok of raw.split(',')) {
    if (['clear', 'partly', 'overcast', 'fog', 'drizzle', 'rain', 'storm', 'snow'].includes(tok)) out.kind = tok
    else if (['night', 'dawn', 'day', 'golden', 'dusk'].includes(tok)) out.phase = tok
    else if (/^wind\d+$/.test(tok)) out.wind = +tok.slice(4)
  }
  return out
}

export const moodKey = (m) => `${m.kind}|${m.phase}|${Math.round(m.wind)}|${m.heavy ? 1 : 0}`
