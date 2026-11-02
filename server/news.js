// search_news / search_blogs: 네이버 검색 API(키 있으면) → 없으면 Google News RSS(키 불필요)
import { XMLParser } from 'fast-xml-parser'
import { getJson, getText, cached } from './http.js'

const strip = (s = '') => String(s).replace(/<[^>]+>/g, '').replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&#39;', "'")
const hasNaver = () => process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET
const naverHeaders = () => ({ 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET })

// 이슈제주 공식 RSS — 제목·요약·원문 링크만 사용
export async function getIssueJeju({ limit = 20 } = {}) {
  const xml = await cached('issuejeju', 600e3, () => getText('https://www.issuejeju.com/data/rss/news.xml'))
  const raw = new XMLParser().parse(xml)?.rss?.channel?.item ?? []
  const arr = Array.isArray(raw) ? raw : [raw]
  return {
    source: '이슈제주 RSS', home: 'https://www.issuejeju.com/',
    items: arr.slice(0, limit).map((i) => ({ title: strip(i.title), summary: strip(i.description), url: i.link, image: i.img || null, date: i['dc:date'] })),
  }
}

export async function searchNews({ query = '제주', limit = 12 } = {}) {
  const q = query.includes('제주') ? query : '제주 ' + query
  if (hasNaver()) {
    const d = await cached('naver-news:' + q, 600e3, () =>
      getJson(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=${limit}&sort=date`, { headers: naverHeaders() }))
    return { source: '네이버 뉴스 검색', items: d.items.map((i) => ({ title: strip(i.title), summary: strip(i.description), url: i.originallink || i.link, date: i.pubDate })) }
  }
  const xml = await cached('gnews:' + q, 600e3, () =>
    getText(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`))
  const parsed = new XMLParser().parse(xml)
  const raw = parsed?.rss?.channel?.item ?? []
  const arr = Array.isArray(raw) ? raw : [raw]
  return {
    source: 'Google 뉴스 RSS',
    items: arr.slice(0, limit).map((i) => ({
      title: strip(i.title), summary: '', url: i.link, date: i.pubDate, press: i.source?.['#text'] ?? i.source ?? null,
    })),
  }
}

export async function searchBlogs({ query = '제주 맛집', limit = 8 } = {}) {
  if (process.env.KAKAO_REST_KEY) {
    const k = await getJson(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(query)}&size=${limit}`, { headers: { Authorization: 'KakaoAK ' + process.env.KAKAO_REST_KEY } })
    return { available: true, source: '카카오(다음) 블로그 검색', items: k.documents.map((i) => ({ title: strip(i.title), summary: strip(i.contents), url: i.url, blogger: i.blogname, date: (i.datetime || '').slice(0, 10) })) }
  }
  if (!hasNaver()) return { available: false, items: [], reason: 'KAKAO_REST_KEY 가 있으면 블로그 후기를 검색해요' }
  const d = await getJson(`https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=${limit}&sort=sim`, { headers: naverHeaders() })
  return { available: true, source: '네이버 블로그 검색', items: d.items.map((i) => ({ title: strip(i.title), summary: strip(i.description), url: i.link, blogger: i.bloggername, date: i.postdate })) }
}

// 카카오 로컬(키 있으면) 음식점 키워드 검색
export async function kakaoPlaces({ query, category = 'FD6', lat = 33.4996, lon = 126.5312 } = {}) {
  if (!process.env.KAKAO_REST_KEY) return { available: false, items: [] }
  const u = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=${category}&x=${lon}&y=${lat}&radius=20000&size=12`
  const d = await getJson(u, { headers: { Authorization: 'KakaoAK ' + process.env.KAKAO_REST_KEY } })
  return { available: true, source: '카카오 로컬', items: d.documents.map((x) => ({ id: x.id, name: x.place_name, addr: x.road_address_name || x.address_name, url: x.place_url, category: x.category_name, lat: Number(x.y), lon: Number(x.x) })) }
}
