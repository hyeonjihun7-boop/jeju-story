// 오름·올레길·주변 식당: OpenStreetMap(Overpass) + 위키백과 + Open-Meteo 고도 (모두 키 불필요)
import { getJson, cached, distKm } from './http.js'
import { findPlace } from './geo.js'

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const BBOX = '33.10,126.10,33.60,127.00' // 제주도 전체

async function overpass(query, timeout = 25000) {
  let lastErr
  for (const ep of OVERPASS) {
    try {
      return await getJson(ep, {
        method: 'POST', timeout,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      })
    } catch (e) { lastErr = e }
  }
  throw lastErr
}

const FALLBACK_OREUM = [
  { name: '새별오름', lat: 33.3664, lon: 126.3569 }, { name: '용눈이오름', lat: 33.4547, lon: 126.8123 },
  { name: '다랑쉬오름', lat: 33.4723, lon: 126.8008 }, { name: '금오름', lat: 33.3507, lon: 126.3053 },
  { name: '송악산', lat: 33.2054, lon: 126.2908 }, { name: '도두봉', lat: 33.5105, lon: 126.4682 },
]

// find_oreum: OSM 의 natural=peak 중 이름이 있는 봉우리 (가까운 순)
export async function findOreum({ place = '제주시', keyword = '', limit = 8 } = {}) {
  const p = await findPlace({ name: place })
  let peaks, fallback = false
  try {
    const data = await cached('oreum', 6 * 3600e3, () =>
      overpass(`[out:json][timeout:25];node["natural"="peak"]["name"](${BBOX});out body;`))
    peaks = data.elements.map((e) => ({
      id: e.id, name: e.tags.name, ele: e.tags.ele ? Math.round(Number(e.tags.ele)) : null,
      lat: e.lat, lon: e.lon, wikipedia: e.tags.wikipedia ?? null,
    }))
  } catch {
    fallback = true
    peaks = FALLBACK_OREUM.map((o, i) => ({ id: 'f' + i, ...o, ele: null, wikipedia: null }))
  }
  const list = peaks
    .filter((o) => !keyword || o.name.includes(keyword))
    .map((o) => ({ ...o, distKm: Math.round(distKm(p, o) * 10) / 10 }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, limit)
  return { items: list, source: fallback ? '내장 대표 오름 (Overpass 응답 실패)' : 'OpenStreetMap(Overpass)' }
}

// get_elevation: OSM 의 ele 태그가 없으면 Open-Meteo 고도 API
export async function getElevation({ lat, lon }) {
  const d = await getJson(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`)
  return { elevation: Math.round(d.elevation?.[0]), source: 'Open-Meteo Elevation' }
}

// get_wiki_summary: 한국어 위키백과 요약
export async function getWikiSummary({ title }) {
  if (!title) return { found: false }
  const t = encodeURIComponent(title.replace(/^ko:/, '').replace(/ /g, '_'))
  try {
    const d = await cached('wiki:' + title, 24 * 3600e3, () => getJson(`https://ko.wikipedia.org/api/rest_v1/page/summary/${t}`))
    if (!d.extract) return { found: false }
    return { found: true, title: d.title, extract: d.extract, url: d.content_urls?.desktop?.page, thumb: d.thumbnail?.source }
  } catch { return { found: false } }
}

// find_olle_routes: OSM 에 제주올레 route 가 있으면 사용, 없으면 대표 코스(내장) + 공식 사이트 링크
export const OLLE_OFFICIAL = 'https://www.jejuolle.org/trail#/'
const OLLE_FALLBACK = [
  { id: 'c1', ref: '1', name: '제주올레 1코스', from: '시흥초등학교', to: '광치기해변', place: '성산' },
  { id: 'c7', ref: '7', name: '제주올레 7코스', from: '외돌개', to: '월평마을', place: '서귀포' },
  { id: 'c10', ref: '10', name: '제주올레 10코스', from: '화순금모래해수욕장', to: '모슬포항', place: '모슬포' },
  { id: 'c18', ref: '18', name: '제주올레 18코스', from: '제주 원도심', to: '조천', place: '제주시' },
]

export async function findOlleRoutes({ keyword = '' } = {}) {
  let items = []
  let source = '대표 코스(내장) · 전체 코스와 거리는 제주올레 공식 사이트'
  try {
    const data = await cached('olle', 6 * 3600e3, () =>
      overpass(`[out:json][timeout:20];relation["route"~"hiking|foot"]["name"~"올레"](${BBOX});out tags center;`, 9000))
    items = data.elements.map((e) => ({
      id: e.id, name: e.tags.name, ref: e.tags.ref ?? null, from: e.tags.from ?? null, to: e.tags.to ?? null,
      lat: e.center?.lat, lon: e.center?.lon, osm: true,
    }))
    if (items.length) source = 'OpenStreetMap(Overpass)'
  } catch { /* 아래 대표 코스로 대체 */ }
  if (!items.length) items = OLLE_FALLBACK
  items = items.filter((r) => !keyword || r.name.includes(keyword) || String(r.ref) === keyword)
    .map((r) => ({ ...r, url: OLLE_OFFICIAL }))
  return { items, source, official: OLLE_OFFICIAL }
}

// get_route_length: 경로 geometry 를 따라 실제 길이 계산
export async function getRouteLength({ id }) {
  const data = await cached('olle-len:' + id, 24 * 3600e3, () =>
    overpass(`[out:json][timeout:25];relation(${Number(id)});out geom;`))
  const rel = data.elements[0]
  if (!rel) throw new Error('경로를 찾지 못했어요')
  let km = 0
  for (const m of rel.members ?? []) {
    const g = m.geometry
    if (m.type !== 'way' || !g) continue
    for (let i = 1; i < g.length; i++) km += distKm({ lat: g[i - 1].lat, lon: g[i - 1].lon }, { lat: g[i].lat, lon: g[i].lon })
  }
  return { id: Number(id), name: rel.tags?.name, km: Math.round(km * 10) / 10, source: 'OSM geometry 합산' }
}

// 주변 식당·카페 (카카오 키가 없을 때 대체)
export async function nearbyFood({ place = '제주시', kind = 'restaurant', limit = 12 } = {}) {
  const p = await findPlace({ name: place })
  const amenity = kind === 'cafe' ? 'cafe' : 'restaurant'
  const data = await cached(`food:${amenity}:${p.name}`, 3600e3, () =>
    overpass(`[out:json][timeout:25];node["amenity"="${amenity}"]["name"](around:4000,${p.lat},${p.lon});out body 60;`))
  return data.elements.map((e) => ({
    id: e.id, name: e.tags.name, cuisine: e.tags.cuisine ?? null, lat: e.lat, lon: e.lon,
    distKm: Math.round(distKm(p, { lat: e.lat, lon: e.lon }) * 10) / 10,
  })).sort((a, b) => a.distKm - b.distKm).slice(0, limit)
}
