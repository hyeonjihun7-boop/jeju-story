import { route } from '../server/handler.js'
import { searchFestivals } from '../server/tour.js'
import { searchNews } from '../server/news.js'

// /api/festivals?year=2026 — 키가 있으면 TourAPI 연간 행사, 없으면 "제주 축제" 뉴스로 대체
export default route(async (q) => {
  const year = Number(q.year) || undefined
  if (process.env.DATA_GO_KR_KEY) return { source: '한국관광공사 TourAPI', year, items: await searchFestivals({ year }) }
  // 키가 없으면 선택한 달의 축제 뉴스를 검색 (월 버튼에 따라 결과가 바뀜)
  const month = Math.min(12, Math.max(1, Number(q.month) || new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1))
  const n = await searchNews({ query: `제주 ${month}월 축제`, limit: 12 })
  return { fallback: true, month, source: n.source + ` (TourAPI 키가 없어 ${month}월 축제 뉴스로 대체)`, items: n.items }
})
