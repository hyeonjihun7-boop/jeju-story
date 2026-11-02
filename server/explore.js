// 관광 추천: 날씨에 따라 실외(오름·올레) / 실내(박물관) 구성
import { getToday } from './today.js'
import { findOreum, findOlleRoutes } from './osm.js'
import { INDOOR } from './data/curated.js'
import { getIndoorAll } from './indoor.js'
import { getOutdoorAll } from './outdoor.js'
import { getDailyPicks } from './daily.js'

export async function getExplore({ place = '제주시', mode } = {}) {
  const today = await getToday({ place })
  const use = mode === 'indoor' || mode === 'outdoor' ? mode : today.mode.mode
  const notes = []
  const auto = !(mode === 'indoor' || mode === 'outdoor')
  const pop = today.weather.today.pop
  const reason = auto ? today.mode.reason
    : use === 'outdoor' ? `강수확률 ${pop}% — 야외 코스예요${pop >= 50 ? ' (우산·방수 신발 챙기세요)' : ''}` : '실내 명소 모음이에요'
  const out = { mode: use, reason, auto, sections: [] }

  if (use === 'outdoor') {
    const [oreum, olle] = await Promise.allSettled([findOreum({ place, limit: 8 }), findOlleRoutes({})])
    if (oreum.status === 'fulfilled') out.sections.push({ key: 'oreum', title: '가까운 오름', source: oreum.value.source, items: oreum.value.items })
    else notes.push('오름 데이터를 불러오지 못했어요')
    if (olle.status === 'fulfilled') out.sections.push({ key: 'olle', title: '올레길 코스', source: olle.value.source, items: olle.value.items.slice(0, 12) })
    else notes.push('올레길 데이터를 불러오지 못했어요')
    if (process.env.DATA_GO_KR_KEY) {
      const all = await getOutdoorAll().catch(() => [])
      if (all.length) out.sections.push({ key: 'outdoorAll', title: '제주 야외 명소 전체', source: '한국관광공사 TourAPI (관광지 + 레포츠, 실내형 제외)', items: all })
    }
  } else {
    out.sections.push({ key: 'indoor', title: '여행객 추천 실내 명소 BEST', source: '큐레이션', items: INDOOR })
    if (process.env.DATA_GO_KR_KEY) {
      const all = await getIndoorAll().catch(() => [])
      if (all.length) out.sections.push({ key: 'indoorAll', title: '제주 실내 명소 전체', source: '한국관광공사 TourAPI (문화시설 + 실내형 관광지)', items: all })
    }
  }
  // 오늘의 추천: 날짜별로 바뀌는 장소 (키가 있을 때). 모든 탭의 맨 위에 둔다
  if (process.env.DATA_GO_KR_KEY) {
    const daily = await getDailyPicks({ mode: use }).catch(() => null)
    if (daily?.items.length) out.sections.unshift({ key: 'daily', title: '오늘의 추천', mode: use, date: daily.date, items: daily.items, source: '한국관광공사 TourAPI에서 매일 다르게 고른 추천 (사진 있는 곳만)' })
  }
  out.center = { lat: today.weather.lat, lon: today.weather.lon, name: today.weather.place }
  out.notes = notes
  out.today = { pop: today.weather.today.pop, desc: today.weather.now.desc, temp: today.weather.now.temp }
  return out
}
