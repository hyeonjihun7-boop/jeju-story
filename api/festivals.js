import { route } from '../server/handler.js'
import { searchFestivals } from '../server/tour.js'
import { searchNews } from '../server/news.js'
import { getImageFor } from '../server/photos.js'

// /api/festivals?year=2026 — 키가 있으면 TourAPI 연간 행사, 없으면 "제주 축제" 뉴스로 대체
export default route(async (q) => {
  const year = Number(q.year) || undefined
  if (process.env.DATA_GO_KR_KEY) return { source: '한국관광공사 TourAPI', year, items: await searchFestivals({ year }) }
  // 키가 없으면 선택한 달의 축제 뉴스를 검색 (월 버튼에 따라 결과가 바뀜)
  const month = Math.min(12, Math.max(1, Number(q.month) || new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1))
  const n = await searchNews({ query: `제주 ${month}월 축제`, limit: 12 })
  // 뉴스에는 이미지가 없어서, 기사 제목(매체명 제외)으로 카카오 이미지 검색을 해 포스터 사진을 붙인다
  const clean = (t) => t.replace(/s+[-–]s+[^-–]+$/, '').replace(/[[]“”'"‘’]/g, '').slice(0, 40)
  const items = await Promise.all(n.items.map(async (it) => {
    const img = await getImageFor(clean(it.title) + ' 제주 축제').catch(() => null)
    return { ...it, image: img?.image ?? null, thumb: img?.thumb ?? null }
  }))
  return { fallback: true, month, source: n.source + ` (TourAPI 키가 없어 ${month}월 축제 뉴스로 대체) · 이미지: 카카오 이미지 검색`, items }
})
