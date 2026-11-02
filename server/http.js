// 외부 API 공용 fetch: 타임아웃 + JSON 파싱 에러 메시지
const UA = 'TodayJeju/1.0 (education project; https://github.com/hyeonjihun7-boop/jeju-story)'
export async function getJson(url, { headers, timeout = 12000, method = 'GET', body } = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, method, body, signal: AbortSignal.timeout(timeout) })
  const text = await r.text()
  try { return JSON.parse(text) }
  catch { throw new Error(`JSON이 아닌 응답 (${r.status}) ${text.slice(0, 100)}`) }
}

export async function getText(url, { headers, timeout = 12000 } = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(timeout) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.text()
}

// 서버리스 인스턴스가 살아 있는 동안만 유지되는 간단한 메모리 캐시
const cache = new Map()
export async function cached(key, ttlMs, fn) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value
  const value = await fn()
  cache.set(key, { at: Date.now(), value })
  return value
}

export function distKm(a, b) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
