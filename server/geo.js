// find_place: 지명 → 좌표. 제주 주요 권역은 내장, 그 외는 Open-Meteo 지오코딩
import { getJson, cached } from './http.js'

export const AREAS = {
  제주시: { lat: 33.4996, lon: 126.5312 },
  서귀포: { lat: 33.2541, lon: 126.5601 },
  애월: { lat: 33.4636, lon: 126.3311 },
  한림: { lat: 33.4137, lon: 126.2663 },
  중문: { lat: 33.2478, lon: 126.4125 },
  성산: { lat: 33.4585, lon: 126.9426 },
  구좌: { lat: 33.524, lon: 126.848 },
  표선: { lat: 33.3258, lon: 126.8307 },
  우도: { lat: 33.5058, lon: 126.9521 },
}

export async function findPlace({ name = '제주시' } = {}) {
  const key = Object.keys(AREAS).find((k) => name.includes(k) || k.includes(name))
  if (key) return { name: key, ...AREAS[key], source: 'builtin' }
  const q = encodeURIComponent(name)
  const data = await cached('geo:' + name, 3600e3, () =>
    getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=10&language=ko&countryCode=KR`))
  const hit = (data.results ?? []).find((r) => /제주|Jeju/i.test(r.admin1 ?? '')) ?? data.results?.[0]
  if (!hit) return { name: '제주시', ...AREAS.제주시, source: 'fallback', note: `"${name}"을(를) 찾지 못해 제주시로 대체` }
  return { name: hit.name, lat: hit.latitude, lon: hit.longitude, source: 'open-meteo-geocoding' }
}
