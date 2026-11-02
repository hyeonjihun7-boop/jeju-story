import { route } from '../server/handler.js'
import { searchFestivals } from '../server/tour.js'
import { searchNews } from '../server/news.js'

// 키가 있으면 TourAPI 공식 행사 목록, 없으면 "제주 축제" 최신 뉴스로 대체
export default route(async () => {
  if (process.env.DATA_GO_KR_KEY) return { source: '한국관광공사 TourAPI', items: await searchFestivals({}) }
  const n = await searchNews({ query: '제주 축제', limit: 12 })
  return { fallback: true, source: n.source + ' (TourAPI 키가 없어 뉴스로 대체)', items: n.items }
})
