// 날씨 + 대기질 → 오늘의 옷차림 · 하루 4칸 실내/실외 판단 (규칙 기반, 에이전트 도구로도 사용)
const BANDS = [
  { min: 28, layer: '얇은 옷', title: '한여름 차림', pieces: ['민소매·반팔', '반바지·린넨 팬츠', '샌들'] },
  { min: 23, layer: '얇은 옷', title: '반팔 차림', pieces: ['반팔 티', '얇은 면바지·치마'] },
  { min: 20, layer: '얇은 옷', title: '가벼운 긴팔', pieces: ['얇은 긴팔', '얇은 셔츠', '청바지'] },
  { min: 17, layer: '적당한 옷', title: '가디건 날씨', pieces: ['맨투맨·얇은 니트', '가디건', '청바지'] },
  { min: 12, layer: '적당한 옷', title: '자켓 날씨', pieces: ['니트', '자켓·가디건', '긴바지'] },
  { min: 9, layer: '두꺼운 옷', title: '코트 날씨', pieces: ['도톰한 니트', '트렌치·코트', '가벼운 목도리'] },
  { min: 5, layer: '두꺼운 옷', title: '따뜻하게', pieces: ['히트텍', '두꺼운 코트', '장갑·목도리'] },
  { min: -99, layer: '두꺼운 옷', title: '한겨울 차림', pieces: ['히트텍', '패딩', '장갑·목도리·모자'] },
]

export function recommendOutfit(weather, air) {
  const w = weather.today
  const band = BANDS.find((b) => w.avgFeel >= b.min)
  const tips = []
  const gear = []
  if (w.range >= 8) tips.push(`일교차 ${w.range}° — 아침·저녁엔 겉옷이 필요해요`)
  if (w.maxWind >= 7) { gear.push('바람막이'); tips.push(`최대 풍속 ${Math.round(w.maxWind)}m/s — 제주 바람은 체감온도를 확 낮춰요`) }
  if (w.pop >= 50 || w.rainHours.length) { gear.push('우산', '방수 신발'); tips.push(`강수확률 ${w.pop}% — 우산·방수 신발`) }
  if (w.uv >= 6) { gear.push('선크림', '모자·선글라스'); tips.push(`자외선 지수 ${Math.round(w.uv)} — 자외선 차단 필수`) }
  const pmLevel = air ? air.grade.overall.level : 0
  if (pmLevel >= 2) { gear.push('KF94 마스크'); tips.push(`미세먼지 ${air.grade.overall.label} — 마스크를 챙기세요`) }
  else if (air?.yellowDust.level > 0) { gear.push('KF80 마스크'); tips.push('황사 기운이 있어 마스크가 있으면 좋아요') }
  const outer = band.layer === '얇은 옷' ? w.range >= 8 || w.maxWind >= 7 : true
  return {
    title: band.title, layer: band.layer, outer, feel: w.avgFeel,
    outerText: outer ? '겉옷 챙기기' : '겉옷 없이 OK',
    pieces: band.pieces, gear: [...new Set(gear)], tips,
    headline: `${band.layer} · ${outer ? '겉옷 있으면 좋아요' : '겉옷 없이도 괜찮아요'}`,
  }
}

const SLOTS = [
  { key: 'morning', label: '오전', from: 8, to: 11 },
  { key: 'lunch', label: '점심', from: 12, to: 13 },
  { key: 'afternoon', label: '오후', from: 14, to: 17 },
  { key: 'evening', label: '저녁', from: 18, to: 21 },
]

export function buildDayPlan(weather, air) {
  const badAir = air && air.grade.overall.level >= 2
  return SLOTS.map((s) => {
    const hs = weather.hourly.filter((h) => h.hour >= s.from && h.hour <= s.to)
    const pop = Math.max(0, ...hs.map((h) => h.pop))
    const temp = hs.length ? Math.round(hs.reduce((a, h) => a + h.temp, 0) / hs.length) : null
    const rainy = pop >= 50 || hs.some((h) => h.rain >= 0.5)
    const windy = hs.some((h) => h.wind >= 10)
    let mode = 'outdoor'
    let reason = '야외 활동하기 좋은 시간'
    if (rainy) { mode = 'indoor'; reason = `강수확률 ${pop}% — 실내로` }
    else if (badAir) { mode = 'indoor'; reason = `미세먼지 ${air.grade.overall.label} — 실내로` }
    else if (windy) { mode = 'indoor'; reason = '강풍 — 해안·오름은 피하세요' }
    else if (s.key === 'lunch') { mode = 'food'; reason = '점심 — 맛집·카페 타임' }
    else if (s.key === 'evening' && pop < 30) reason = '노을·산책하기 좋아요'
    return { ...s, mode, pop, temp, reason }
  })
}

// 현재 시점 기준 실내/실외 종합 판단 (관광 추천용)
export function overallMode(weather, air) {
  const w = weather.today
  if (w.pop >= 60 || w.rainHours.length >= 4) return { mode: 'indoor', reason: `오늘 강수확률 ${w.pop}% — 실내 중심으로 추천해요` }
  if (air && air.grade.overall.level >= 2) return { mode: 'indoor', reason: `미세먼지 ${air.grade.overall.label} — 실내 중심으로 추천해요` }
  return { mode: 'outdoor', reason: `강수확률 ${w.pop}% — 오름·올레 같은 야외 코스 추천` }
}
