// 일정·북마크에 나온 장소 이름 → 좌표 (한국관광공사 TourAPI 키워드 검색).
// 엉뚱한 곳에 핀을 찍지 않도록, 이름이 (거의) 같을 때만 받아들이고 못 찾으면 좌표 없이 돌려준다.
import { cached, getJson } from './http.js'
import { searchSpots } from './tour.js'

const TAIL = /(해안산책|해안|산책|코스|근처|일대|주변|체험|관람|투어)$/
const TAIL_SPACED = /\s*(해안\s*산책|해안|산책|코스|근처|일대|주변|체험|관람|투어)\s*$/
const norm = (s) => s.replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/[\s·,/.\-~]/g, '')
// 설명이 붙은 이름("용두암 해안 산책")에서 핵심 이름만 남긴다
const core = (name) => { let n = norm(name); while (TAIL.test(n) && n.length > 3) n = n.replace(TAIL, ''); return n }

const accept = (hitTitle, c) => {
  const h = norm(hitTitle)
  return h === c || (c.length >= 4 && h.startsWith(c)) || (h.length >= 4 && c.startsWith(h))
    || (c.length >= 5 && h.includes(c) && h.length - c.length <= 3) // "해녀박물관" ↔ "제주해녀박물관"
}

async function resolveOne(name) {
  const c = core(name)
  if (c.length < 2) return { name, lat: null, lon: null }
  // 검색어 변형: 원래 이름(공백 포함) · 핵심 이름 · 앞의 '제주' 뺀 이름 (TourAPI 는 부분 일치 검색)
  const spaced = name.replace(/\([^)]*\)/g, '').replace(TAIL_SPACED, '').trim()
  const queries = [...new Set([spaced, c, c.replace(/^제주(도)?/, '')])].filter((q) => q.length >= 2)
  for (const q of queries) {
    const rows = await cached('place:' + q, 6 * 3600e3, () => searchSpots({ keyword: q, contentTypeId: '' })).catch(() => [])
    const hit = rows.find((r) => Number.isFinite(r.lat) && accept(r.title, c))
    if (hit) return { name, lat: hit.lat, lon: hit.lon, title: hit.title, addr: hit.addr?.replace('제주특별자치도 ', '') }
  }
  return { name, lat: null, lon: null }
}

// TourAPI 에 없는 곳(식당·카페·상점 등)은 OpenStreetMap 검색(Nominatim)으로 한 번 더 찾는다.
// 공개 서버라 초당 1건만 보내고, "맛집"처럼 특정 장소가 아닌 말은 건너뛴다.
const GENERIC = /(맛집|식당|카페|인근|근처|주변|일대|숙소|호텔|휴식|산책로|식사|점심|저녁|조식|체크인|체크아웃|공항)$/
async function viaOsm(name) {
  const c = core(name)
  const bare = name.replace(/\([^)]*\)/g, '').trim()
  if (c.length < 3 || GENERIC.test(bare)) return null
  const q = bare.replace(TAIL_SPACED, '').trim()
  const rows = await cached('osmplace:' + q, 6 * 3600e3, () => getJson(
    'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: q.startsWith('제주') ? q : '제주 ' + q, format: 'jsonv2', limit: '5', 'accept-language': 'ko', viewbox: '126.10,33.60,127.05,33.10', bounded: '1' }),
    { headers: { 'User-Agent': 'jeju-story-bootcamp/1.0 (student project)' }, timeout: 6000 },
  )).catch(() => [])
  const hit = rows.find((r) => accept(r.name || r.display_name?.split(',')[0] || '', c))
  return hit ? { name, lat: Number(hit.lat), lon: Number(hit.lon), title: hit.name, addr: hit.display_name?.split(',').slice(1, 3).join(',').trim() } : null
}

export async function resolvePlaces(names = []) {
  if (!process.env.DATA_GO_KR_KEY) return { items: names.map((name) => ({ name, lat: null, lon: null })), reason: 'DATA_GO_KR_KEY 필요' }
  const list = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 30)
  const items = await Promise.all(list.map(resolveOne))
  let tries = 0
  for (let i = 0; i < items.length && tries < 4; i++) {
    if (Number.isFinite(items[i].lat)) continue
    tries++
    const hit = await viaOsm(items[i].name).catch(() => null)
    if (hit) items[i] = hit
    if (tries < 4) await new Promise((r) => setTimeout(r, 1100))
  }
  return { items }
}
