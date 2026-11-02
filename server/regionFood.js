// 지역별 맛집·카페: 카카오 로컬(켜져 있으면 실제 가게 + 사진) → 아니면 카카오 블로그 후기(대표 사진 포함)
import { getJson, cached } from './http.js'
import { findPlace } from './geo.js'
import { getImageFor } from './photos.js'

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

export async function getRegionFood({ kind = 'restaurant' } = {}) {
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
