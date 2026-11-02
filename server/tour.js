// 한국관광공사 TourAPI (국문 관광정보 서비스 KorService2) — DATA_GO_KR_KEY 필요
// ※ 예전 KorService1 주소는 폐기되어 NO_OPENAPI_SERVICE_ERROR(코드 12)가 납니다. 반드시 KorService2 사용.
import { getJson, cached } from './http.js'

const BASE = 'https://apis.data.go.kr/B551011/KorService2'

function need() {
  if (!process.env.DATA_GO_KR_KEY) throw new Error('DATA_GO_KR_KEY 가 설정되지 않았어요 (.env.local)')
}

async function call(op, extra) {
  need()
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'TodayJeju', _type: 'json',
    numOfRows: '12', pageNo: '1', areaCode: '39', ...extra,
  })
  const data = await cached(`tour:${op}:${params}`, 1800e3, () => getJson(`${BASE}/${op}?${params}`))
  const header = data?.response?.header
  if (header && header.resultCode !== '0000') throw new Error(`TourAPI 오류 ${header.resultCode}: ${header.resultMsg}`)
  const item = data?.response?.body?.items?.item
  return !item ? [] : Array.isArray(item) ? item : [item]
}

const shape = (p) => ({
  id: p.contentid, title: p.title, addr: p.addr1, image: p.firstimage || null,
  lat: Number(p.mapy) || null, lon: Number(p.mapx) || null, type: p.contenttypeid,
  start: p.eventstartdate ?? null, end: p.eventenddate ?? null, tel: p.tel || null,
})

// search_spots: 관광지(12) · 문화시설(14) · 음식점(39) 키워드 검색
export async function searchSpots({ keyword = '', contentTypeId = '12', page = 1, rows = 12, cat3 } = {}) {
  const extra = { contentTypeId, pageNo: String(page), numOfRows: String(rows) }
  if (cat3) extra.cat3 = cat3
  if (keyword) extra.keyword = keyword
  return (await call(keyword ? 'searchKeyword2' : 'areaBasedList2', extra)).map(shape)
}

// search_festivals: 해당 연도 전체 행사 (월별 보기는 화면에서 필터)
export async function searchFestivals({ year, onlyUpcoming = false } = {}) {
  const kst = new Date(Date.now() + 9 * 3600e3)
  const y = String(year ?? kst.getUTCFullYear())
  const today = kst.toISOString().slice(0, 10).replaceAll('-', '')
  const list = (await call('searchFestival2', { eventStartDate: y + '0101', numOfRows: '300' })).map(shape)
    .filter((f) => f.start && f.start.startsWith(y) || (f.end && f.end.startsWith(y)))
  return list.filter((f) => !onlyUpcoming || !f.end || f.end >= today)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))
}
