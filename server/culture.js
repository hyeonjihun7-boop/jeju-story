// 제주 문화생활: 이슈제주 RSS 의 전시·공연·문화 기사(기사 대표 사진) + 전시·공연 뉴스
// ※ 플레이제주(playjeju.co.kr)는 데이터가 /api/ 로만 제공되고 robots.txt 가 /api/ 를 막고 있어 가져오지 않고 링크로 연결합니다.
import { getIssueJeju, searchNews } from './news.js'
import { dedupe } from './dedupe.js'

const CULTURE = /전시|공연|미술|예술|연극|뮤지컬|콘서트|음악회|영화|도서|작가|박물관|미술관|문화|무용|국악|오케스트라|사진전|북페어|아트/
const NOISE = /성폭력|예방|교육청|인사|부고|교통|캠페인|안전|단속|화재/

export const PLAYJEJU = [
  { name: '문화행사', desc: '공연·전시·축제 등 제주 문화행사 목록', url: 'https://playjeju.co.kr/events', icon: 'ticket-perforated' },
  { name: '행사 달력', desc: '날짜별로 보는 문화행사 일정', url: 'https://playjeju.co.kr/events/calendar', icon: 'calendar3' },
  { name: '웹진', desc: '제주 문화예술 이야기', url: 'https://playjeju.co.kr/webzine', icon: 'journal-richtext' },
  { name: '커뮤니티', desc: '문화 소식과 후기', url: 'https://playjeju.co.kr/community', icon: 'people' },
]

export async function getCulture() {
  const [issue, news] = await Promise.all([
    getIssueJeju({ limit: 50 }).catch(() => ({ items: [] })),
    searchNews({ query: '제주 전시 공연', limit: 12 }).catch(() => ({ items: [], source: '' })),
  ])
  const own = issue.items.filter((i) => CULTURE.test(i.title) && !NOISE.test(i.title)).map((i) => ({ ...i, press: '이슈제주' }))
  return {
    links: PLAYJEJU,
    source: '이슈제주 RSS(기사 대표 사진) · ' + news.source,
    items: dedupe([...own, ...news.items]).slice(0, 16),
  }
}
