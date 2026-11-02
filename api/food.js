import { route } from '../server/handler.js'
import { nearbyFood } from '../server/osm.js'
import { kakaoPlaces, searchBlogs } from '../server/news.js'
import { findPlace } from '../server/geo.js'
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
  const blogs = await searchBlogs({ query: place + (kind === 'cafe' ? ' 카페 후기' : ' 맛집 후기') }).catch(() => ({ available: false, items: [] }))
  return { places, blogs }
})
