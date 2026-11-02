// 지역별 맛집·카페: 카카오 로컬(켜져 있으면 실제 가게 + 사진) → 아니면 카카오 블로그 후기(대표 사진 포함)
import { getJson, cached } from './http.js'
import { findPlace } from './geo.js'
import { distKm } from './http.js'
import { nearbyFood } from './osm.js'
import { getImageFor } from './photos.js'
import { listAllFood, nearbyFoodRows } from './tour.js'

export const REGIONS = ['제주시', '애월', '한림', '중문', '서귀포', '표선', '성산', '구좌', '우도']
const H = () => ({ Authorization: 'KakaoAK ' + process.env.KAKAO_REST_KEY })
const strip = (s = '') => String(s).replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&quot;', '"')

async function local(region, kind) {
  const p = await findPlace({ name: region })
  const query = '제주 ' + region + (kind === 'cafe' ? ' 카페' : ' 맛집')
  const d = await cached(`rf-local:${query}`, 3600e3, () =>
    getJson(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=${kind === 'cafe' ? 'CE7' : 'FD6'}&x=${p.lon}&y=${p.lat}&radius=15000&size=6`, { headers: H() }))
  if (!d.documents) throw new Error(d.message || 'local disabled')
  const items = await Promise.all(d.documents.map(async (x) => {
    const img = await getImageFor(`${x.place_name} ${region}`).catch(() => null)
    return { id: x.id, title: x.place_name, sub: x.road_address_name || x.address_name, link: x.place_url, lat: Number(x.y), lon: Number(x.x), image: img?.image ?? null, thumb: img?.thumb ?? null }
  }))
  return items
}

async function blogs(region, kind) {
  const query = `제주 ${region === '제주시' ? '제주시' : region} ${kind === 'cafe' ? '카페' : '맛집'} 후기`
  const d = await cached(`rf-blog:${query}`, 3600e3, () =>
    getJson(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(query)}&size=10&sort=accuracy`, { headers: H() }))
  return (d.documents ?? []).filter((x) => x.thumbnail).slice(0, 6).map((x, i) => ({
    id: x.url, title: strip(x.title), sub: x.blogname, link: x.url, image: x.thumbnail, thumb: x.thumbnail, lat: null, lon: null, n: i,
  }))
}

// 주소 → 화면의 지역 구분
function regionOf(addr = '') {
  if (/우도면/.test(addr)) return '우도'
  if (/구좌읍/.test(addr)) return '구좌'
  if (/성산읍/.test(addr)) return '성산'
  if (/표선면/.test(addr)) return '표선'
  if (/애월읍/.test(addr)) return '애월'
  if (/한림읍|한경면/.test(addr)) return '한림'
  if (/중문|색달|대포|예래|천제연|하원|강정/.test(addr)) return '중문'
  if (/서귀포시/.test(addr)) return '서귀포'
  return '제주시'
}

// TourAPI(DATA_GO_KR_KEY): 제주 음식점·카페 전체를 지역별로 (사진·좌표 포함)
async function fromTour(kind) {
  const rows = await cached('rf-tour:' + kind, 6 * 3600e3, () => listAllFood({ cafe: kind === 'cafe' }))
  const by = Object.fromEntries(REGIONS.map((r) => [r, []]))
  for (const p of rows) {
    const region = regionOf(p.addr)
    by[region].push({
      id: p.id, title: p.title, sub: p.addr?.replace('제주특별자치도 ', ''), image: p.image, thumb: p.image,
      link: p.lat ? `https://map.kakao.com/link/map/${encodeURIComponent(p.title)},${p.lat},${p.lon}` : null, lat: p.lat, lon: p.lon,
    })
  }
  // 사진이 있는 곳을 앞에 둔다
  return REGIONS.map((region) => ({ region, items: by[region].sort((a, b) => Number(!!b.image) - Number(!!a.image)) })).filter((s) => s.items.length)
}

// AI 도구용: 지역 주변 식당·카페. OSM(Overpass)은 자주 느리거나 실패해서, 한국관광공사 목록(캐시)을 먼저 쓰고 안 될 때만 OSM 으로 대체한다.
export async function nearbyFoodForAgent({ place = '제주시', kind = 'restaurant', limit = 12 } = {}) {
  if (process.env.DATA_GO_KR_KEY) {
    try {
      const p = await findPlace({ name: place })
      let rows = await nearbyFoodRows({ lat: p.lat, lon: p.lon, cafe: kind === 'cafe', rows: Math.max(limit, 12) }).catch(() => [])
      if (!rows.length) rows = await cached('rf-tour:' + kind, 6 * 3600e3, () => listAllFood({ cafe: kind === 'cafe' }))
      const items = rows.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon))
        .map((r) => ({ name: r.title, addr: r.addr?.replace('제주특별자치도 ', ''), tel: r.tel, lat: r.lat, lon: r.lon, distKm: Math.round(distKm(p, r) * 10) / 10 }))
        .filter((r) => r.distKm <= 6).sort((a, b) => a.distKm - b.distKm).slice(0, limit)
      if (items.length) return items
    } catch { /* OSM 으로 대체 */ }
  }
  return nearbyFood({ place, kind, limit })
}

export async function getRegionFood({ kind = 'restaurant' } = {}) {
  if (process.env.DATA_GO_KR_KEY) {
    try {
      const sections = await fromTour(kind)
      if (sections.length) return { available: true, mode: 'tour', source: '한국관광공사 TourAPI (제주 음식점 전체)', total: sections.reduce((n, s) => n + s.items.length, 0), sections }
    } catch { /* 아래 카카오 방식으로 대체 */ }
  }
  if (!process.env.KAKAO_REST_KEY) return { available: false, reason: 'KAKAO_REST_KEY 가 필요해요' }
  let mode = 'places'
  let sections
  try {
    sections = [{ region: REGIONS[0], items: await local(REGIONS[0], kind) }]
    sections.push(...await Promise.all(REGIONS.slice(1).map(async (r) => ({ region: r, items: await local(r, kind) }))))
  } catch {
    mode = 'blogs'
    sections = await Promise.all(REGIONS.map(async (r) => ({ region: r, items: await blogs(r, kind).catch(() => []) })))
  }
  return {
    available: true, mode,
    source: mode === 'places' ? '카카오 로컬 + 카카오 이미지 검색' : '카카오 블로그 검색 (카카오 로컬을 켜면 실제 가게 목록으로 바뀌어요)',
    sections: sections.filter((s) => s.items.length),
  }
}
