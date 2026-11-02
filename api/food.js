import { route } from '../server/handler.js'
import { nearbyFood } from '../server/osm.js'
import { kakaoPlaces, searchBlogs } from '../server/news.js'
import { findPlace } from '../server/geo.js'
import { searchSpots } from '../server/tour.js'
import { DISHES } from '../server/data/curated.js'
export default route(async (q) => {
  const place = q.place || '제주시'
  const kind = q.kind === 'cafe' ? 'cafe' : 'restaurant'
  const p = await findPlace({ name: place })
  const kakao = await kakaoPlaces({ query: kind === 'cafe' ? place + ' 카페' : place + ' 맛집', category: kind === 'cafe' ? 'CE7' : 'FD6', lat: p.lat, lon: p.lon }).catch(() => ({ available: false, items: [] }))
  let places = kakao
  if (!(kakao.available && kakao.items.length)) {
    // 카카오 키가 없으면 OSM 으로 대체. OSM 이 느려도 화면은 빈 목록 + 안내로 계속 동작
    try { places = { source: 'OpenStreetMap(Overpass)', items: await nearbyFood({ place, kind }) } }
    catch { places = { source: 'OpenStreetMap(Overpass) 응답 지연 — 잠시 후 다시 시도하세요', items: [] } }
  }
  // 외부 데이터를 못 받았으면 대표 메뉴 검색 카드로 대체 (빈 화면 방지)
  if (!places.items.length) {
    const link = (n) => `https://map.naver.com/p/search/${encodeURIComponent(place + ' ' + n)}`
    places = {
      fallback: true, source: '제주 대표 메뉴 (주변 식당 데이터를 불러오지 못해 지도 검색으로 연결)',
      items: DISHES.filter((d) => d.cat === kind).map((d) => ({ id: d.id, name: d.name, addr: d.sub, link: link(d.name) })),
    }
  }
  const blogs = await searchBlogs({ query: place + (kind === 'cafe' ? ' 카페 후기' : ' 맛집 후기') }).catch(() => ({ available: false, items: [] }))
  // TourAPI 음식점(39) — 대표 사진이 있어 갤러리로 보여준다 (카페는 세부분류 A05020900)
  let tour = null
  if (process.env.DATA_GO_KR_KEY) {
    const page = Math.max(1, Number(q.page) || 1)
    tour = await searchSpots({ contentTypeId: '39', page, rows: 12, cat3: kind === 'cafe' ? 'A05020900' : undefined })
      .then((items) => ({ items, page })).catch((e) => ({ items: [], page, error: e.message }))
  }
  return { places, blogs, tour }
})
