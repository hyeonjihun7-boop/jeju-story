// 에이전트 도구 정의 + 실행 함수 (화면용 API 와 같은 server/ 함수를 재사용)
import { findPlace } from './geo.js'
import { getWeather } from './weather.js'
import { getAirQuality, getStationAir } from './air.js'
import { getToday } from './today.js'
import { findOreum, findOlleRoutes, getElevation, getWikiSummary, nearbyFood } from './osm.js'
import { searchSpots, searchFestivals } from './tour.js'
import { searchNews, searchBlogs, getIssueJeju } from './news.js'
import { SHOPS, INDOOR } from './data/curated.js'
import { getDarkTourism } from './dark.js'

const place = { type: 'string', description: '지명 (예: 제주시, 서귀포, 애월, 성산)' }

export const tools = [
  { name: 'find_place', description: '제주 지명을 위도·경도로 바꾼다', input_schema: { type: 'object', properties: { name: place }, required: ['name'] } },
  { name: 'get_today_plan', description: '오늘 날씨·미세먼지·옷차림·하루 4칸(오전/점심/오후/저녁) 실내·실외 추천을 한 번에 조회한다', input_schema: { type: 'object', properties: { place } } },
  { name: 'get_weather', description: 'Open-Meteo로 오늘 시간대별 기온·강수확률·바람을 조회한다', input_schema: { type: 'object', properties: { place } } },
  { name: 'get_air_quality', description: '미세먼지(PM10)·초미세먼지(PM2.5)·황사 등급과 예보를 조회한다', input_schema: { type: 'object', properties: { place } } },
  { name: 'get_station_air', description: '에어코리아 제주 측정소 실측 대기질 (키 없으면 사용 불가 안내)', input_schema: { type: 'object', properties: { station: { type: 'string' } } } },
  { name: 'find_oreum', description: 'OpenStreetMap에서 지정 지역과 가까운 오름·봉우리를 찾는다 (고도 포함)', input_schema: { type: 'object', properties: { place, keyword: { type: 'string' } } } },
  { name: 'get_elevation', description: '좌표의 해발고도(m)를 조회한다', input_schema: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } }, required: ['lat', 'lon'] } },
  { name: 'get_wiki_summary', description: '위키백과(한국어)에서 오름·명소 설명을 가져온다', input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
  { name: 'find_olle_routes', description: '제주올레 대표 코스 목록(공식 사이트 링크 포함). 코스 번호/이름 검색', input_schema: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'search_indoor_spots', description: '비 오는 날 갈 만한 실내 명소(박물관·미술관·수족관) 목록', input_schema: { type: 'object', properties: {} } },
  { name: 'search_spots', description: 'TourAPI로 제주 관광지(12)·문화시설(14)·음식점(39)을 검색한다 (DATA_GO_KR_KEY 필요)', input_schema: { type: 'object', properties: { keyword: { type: 'string' }, contentTypeId: { type: 'string' } } } },
  { name: 'search_festivals', description: 'TourAPI로 오늘 이후 제주 축제·행사를 조회한다 (DATA_GO_KR_KEY 필요)', input_schema: { type: 'object', properties: {} } },
  { name: 'search_dark_tourism', description: '제주 다크 투어리즘(4·3·일제강점기 등 역사 유적) 장소와 참여 프로그램(스탬프 투어 등)을 조회한다. 희생자를 기리는 태도로 차분하게 안내할 것', input_schema: { type: 'object', properties: { theme: { type: 'string', enum: ['4·3', '일제강점기'] }, region: { type: 'string', enum: ['동부권', '서부권'] } } } },
  { name: 'search_local_brands', description: '제주 로컬 브랜드(간식·옷·액세서리) 큐레이션 검색. cat: snack | fashion | acc', input_schema: { type: 'object', properties: { cat: { type: 'string', enum: ['snack', 'fashion', 'acc'] } } } },
  { name: 'search_restaurants', description: '지역 주변 식당·카페 검색 (OSM)', input_schema: { type: 'object', properties: { place, kind: { type: 'string', enum: ['restaurant', 'cafe'] } } } },
  { name: 'search_blog_reviews', description: '네이버 블로그 후기 검색 (키 필요)', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_issue_jeju', description: '이슈제주(지역 언론) 최신 기사 목록(제목·요약·링크)', input_schema: { type: 'object', properties: {} } },
  { name: 'search_news', description: '제주 최신 뉴스·이슈 검색', input_schema: { type: 'object', properties: { query: { type: 'string' } } } },
]

export const runTool = {
  find_place: findPlace,
  get_today_plan: async (a) => { const t = await getToday(a); return { place: t.weather.place, now: t.weather.now, today: t.weather.today, air: t.air && { grade: t.air.grade, yellowDust: t.air.yellowDust }, outfit: t.outfit, plan: t.plan, mode: t.mode } },
  get_weather: async (a) => { const w = await getWeather(a); return { place: w.place, now: w.now, today: w.today, hourly: w.hourly.filter((h) => h.hour % 3 === 0).map((h) => ({ hour: h.hour, temp: h.temp, pop: h.pop, label: h.label })) } },
  get_air_quality: getAirQuality,
  get_station_air: getStationAir,
  find_oreum: findOreum,
  get_elevation: getElevation,
  get_wiki_summary: getWikiSummary,
  find_olle_routes: async (a) => { const r = await findOlleRoutes(a); return { ...r, items: r.items.slice(0, 15) } },
  search_indoor_spots: async () => ({ items: INDOOR }),
  search_spots: searchSpots,
  search_festivals: async () => ({ items: (await searchFestivals({ onlyUpcoming: true })).slice(0, 15) }),
  search_dark_tourism: async ({ theme, region } = {}) => { const d = await getDarkTourism(); return { items: d.items.filter((p) => (!theme || p.theme === theme) && (!region || p.region === region)).map(({ name, region: r, theme: t, desc, addr }) => ({ name, region: r, theme: t, desc, addr })), programs: d.programs.map(({ title, desc }) => ({ title, desc })) } },
  search_local_brands: async ({ cat } = {}) => ({ items: SHOPS.filter((s) => !cat || s.cat === cat).map(({ id, name, area, desc, cat: c }) => ({ id, name, area, desc, cat: c })) }),
  search_restaurants: async (a) => ({ items: await nearbyFood(a) }),
  search_blog_reviews: searchBlogs,
  get_issue_jeju: async () => { const r = await getIssueJeju({ limit: 10 }); return { source: r.source, items: r.items.map(({ title, summary, url, date }) => ({ title, summary: summary.slice(0, 120), url, date })) } },
  search_news: async (a) => { const r = await searchNews({ ...a, limit: 6 }); return { source: r.source, items: r.items.map(({ title, press, date }) => ({ title, press, date })) } },
}
