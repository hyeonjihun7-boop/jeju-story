// 탐험 제주 종합: 날씨 + 대기질 + 옷차림 + 하루 4칸 + 실내/실외 판단
import { getWeather } from './weather.js'
import { getAirQuality } from './air.js'
import { recommendOutfit, buildDayPlan, overallMode } from './outfit.js'

export async function getToday({ place = '제주시' } = {}) {
  const [weather, air] = await Promise.all([
    getWeather({ place }),
    getAirQuality({ place }).catch(() => null), // 대기질 실패해도 날씨는 보여준다
  ])
  return {
    weather, air,
    outfit: recommendOutfit(weather, air),
    plan: buildDayPlan(weather, air),
    mode: overallMode(weather, air),
    updatedAt: new Date().toISOString(),
  }
}
