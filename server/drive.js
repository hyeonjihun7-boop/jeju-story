// 일정의 장소 사이 자동차 이동 시간·거리 (OSRM 공개 서버, 키 없음).
// 교통 상황은 반영하지 않은 도로 기준 값이라 "약"으로만 보여준다.
import { cached, getJson } from './http.js'

// pts: "lat,lon;lat,lon;…" (2~12곳) → legs[i] = i번째 → i+1번째 지점
export async function getDriveTimes({ pts = '' } = {}) {
  const list = String(pts).split(';').map((p) => p.split(',').map(Number)).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
  if (list.length < 2 || list.length > 12) return { legs: [] }
  const path = list.map(([lat, lon]) => `${lon.toFixed(5)},${lat.toFixed(5)}`).join(';')
  const d = await cached('drive:' + path, 6 * 3600e3, () => getJson(`https://router.project-osrm.org/route/v1/driving/${path}?overview=false`, { timeout: 8000 }))
  if (d.code !== 'Ok' || !d.routes?.[0]) return { legs: [] }
  return { legs: d.routes[0].legs.map((l) => ({ min: Math.max(1, Math.round(l.duration / 60)), km: Math.round(l.distance / 100) / 10 })) }
}
