import { route } from '../server/handler.js'
import { searchFestivals } from '../server/tour.js'
import { searchNews, getIssueJeju } from '../server/news.js'
import { dedupe } from '../server/dedupe.js'
import { getImageFor } from '../server/photos.js'

// 제목에서 구체적인 행사명(○○축제·페스티벌·박람회 등)만 뽑는다. 없으면 null
const eventName = (t) => {
  const m = t.replace(/s+[-–]s+[^-–]+$/, '').match(/([가-힣0-9]{2,}(?: ?[가-힣0-9]{1,}){0,3}?(?:축제|페스티벌|박람회|문화제|걷기))/)
  const name = m?.[1]?.replace(/^(제주특별자치도|제주시|서귀포시)s*/, '').trim()
  return name && name.length >= 4 ? name : null
}

const FESTIVAL = /축제|행사|페스티벌|박람회|문화제|걷기|마라톤|콘서트|전시|공연/

// /api/festivals?year=2026&month=11
// 키가 있으면 TourAPI 공식 연간 행사(포스터 포함).
// 없으면 ① 이슈제주 기사 중 해당 월 축제·행사 (기사 자신의 대표 사진 — 내용과 일치) ② 월별 축제 뉴스(사진 없음)
export default route(async (q) => {
  const year = Number(q.year) || undefined
  if (process.env.DATA_GO_KR_KEY) return { source: '한국관광공사 TourAPI', year, items: await searchFestivals({ year }) }

  const now = new Date(Date.now() + 9 * 3600e3)
  const month = Math.min(12, Math.max(1, Number(q.month) || now.getUTCMonth() + 1))
  
  const [issue, news] = await Promise.all([
    getIssueJeju({ limit: 50 }).catch(() => ({ items: [] })),
    searchNews({ query: `제주 ${month}월 축제`, limit: 12 }).catch(() => ({ items: [], source: '' })),
  ])
  const own = issue.items
    .filter((i) => FESTIVAL.test(i.title) && month === now.getUTCMonth() + 1) // RSS는 최근 기사만 주므로 이번 달에만 사용
    .map((i) => ({ ...i, press: '이슈제주' }))
  const seen = new Set(own.map((i) => i.title))
  const rest = news.items.filter((i) => !seen.has(i.title)).slice(0, Math.max(0, 12 - own.length))
  return {
    fallback: true, month,
    source: `이슈제주 RSS(기사 대표 사진) · ${news.source} — TourAPI 키가 없어 ${month}월 축제 기사로 대체`,
    items: await withPosters(dedupe([...own, ...rest]).slice(0, 12)),
  }
})

// 사진 없는 항목은 행사명 + "포스터"로 이미지 검색 (참고 이미지)
async function withPosters(items) {
  return Promise.all(items.map(async (it) => {
    if (it.image) return it
    const name = eventName(it.title)
    // 일반적인 이름(가을축제 등)이거나 다른 지역 행사가 섞인 기사는 엉뚱한 사진이 붙기 쉬워 제외
    if (!name || /^(가을|봄|여름|겨울|지역|전국|제주)?s?(축제|페스티벌)$/.test(name) || /진주|통영|천안|전국|서울|부산|대구|광주|전남|경남|경북|충남|충북|강원/.test(it.title)) return it
    const img = await getImageFor(`${name} ${new Date(Date.now() + 9 * 3600e3).getUTCFullYear()} 포스터`).catch(() => null)
    return img ? { ...it, image: img.image, thumb: img.thumb, ref: true } : it
  }))
}
