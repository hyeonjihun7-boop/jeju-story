import { route } from '../server/handler.js'
import { searchFestivals } from '../server/tour.js'
import { searchNews, getIssueJeju } from '../server/news.js'

// 제목에서 매체명·기호를 빼고, 같은 행사를 다룬 기사(공통 표현이 긴 제목)는 중복으로 본다
const norm = (t) => t.replace(/s+[-–]s+[^-–]+$/, '').replace(/[^0-9a-zA-Z가-힣]/g, '')
function commonRun(a, b) {
  let best = 0
  const prev = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    for (let j = b.length; j >= 1; j--) {
      prev[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : 0
      if (prev[j] > best) best = prev[j]
    }
  }
  return best
}
function dedupe(items) {
  const kept = []
  for (const it of items) {
    const n = norm(it.title)
    if (!kept.some((k) => commonRun(k.n, n) >= 6)) kept.push({ n, it })
  }
  return kept.map((k) => k.it)
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
    items: dedupe([...own, ...rest]).slice(0, 12),
  }
})
