// 날씨 + 대기질 → 오늘의 옷차림 · 하루 4칸 실내/실외 판단 (규칙 기반, 에이전트 도구로도 사용)
// 체감온도 구간별 추천: g = 옷 일러스트 종류(src/components/Garment.jsx)
const BANDS = [
  { min: 28, layer: '얇은 옷', title: '한여름 차림', cards: [{ g: 'tee', label: '민소매·반팔', sub: '통풍 잘 되는 소재' }, { g: 'shorts', label: '반바지', sub: '린넨·면' }, { g: 'sandal', label: '샌들', sub: '가볍게' }] },
  { min: 23, layer: '얇은 옷', title: '반팔 차림', cards: [{ g: 'tee', label: '반팔 티', sub: '면 소재' }, { g: 'pants', label: '얇은 면바지', sub: '시원하게' }, { g: 'shirt', label: '얇은 셔츠', sub: '냉방·그늘용' }] },
  { min: 20, layer: '얇은 옷', title: '가벼운 긴팔', cards: [{ g: 'longsleeve', label: '얇은 긴팔', sub: '하루 종일 무난' }, { g: 'shirt', label: '셔츠', sub: '겹쳐 입기 좋아요' }, { g: 'pants', label: '청바지', sub: '데님·면' }] },
  { min: 17, layer: '적당한 옷', title: '가디건 날씨', cards: [{ g: 'knit', label: '얇은 니트', sub: '맨투맨도 좋아요' }, { g: 'cardigan', label: '가디건', sub: '벗고 입기 쉬워요' }, { g: 'pants', label: '청바지', sub: '데님·면' }] },
  { min: 12, layer: '적당한 옷', title: '자켓 날씨', cards: [{ g: 'knit', label: '니트', sub: '속에 입기' }, { g: 'jacket', label: '자켓', sub: '바람막이 겸용' }, { g: 'pants', label: '긴바지', sub: '슬랙스·데님' }] },
  { min: 9, layer: '두꺼운 옷', title: '코트 날씨', cards: [{ g: 'knit', label: '도톰한 니트', sub: '보온 속옷 위에' }, { g: 'coat', label: '트렌치·코트', sub: '바람 막기' }, { g: 'scarf', label: '가벼운 목도리', sub: '목 보온' }] },
  { min: 5, layer: '두꺼운 옷', title: '따뜻하게', cards: [{ g: 'knit', label: '히트텍+니트', sub: '겹쳐 입기' }, { g: 'coat', label: '두꺼운 코트', sub: '울 소재' }, { g: 'scarf', label: '장갑·목도리', sub: '손끝 보온' }] },
  { min: -99, layer: '두꺼운 옷', title: '한겨울 차림', cards: [{ g: 'knit', label: '히트텍', sub: '기본 보온' }, { g: 'puffer', label: '패딩', sub: '바람막이 역할' }, { g: 'scarf', label: '장갑·목도리·모자', sub: '노출 최소화' }] },
]
const bandFor = (feel) => BANDS.find((b) => feel >= b.min)
const GEAR_CARD = {
  우산: { g: 'umbrella', sub: '강수확률 높아요' }, '방수 신발': { g: 'boot', sub: '젖지 않게' }, 바람막이: { g: 'jacket', sub: '제주 바람 대비' },
  선크림: { g: 'sun', sub: '자외선 차단' }, '모자·선글라스': { g: 'hat', sub: '햇빛 가리기' }, 'KF94 마스크': { g: 'mask', sub: '미세먼지 대비' }, 'KF80 마스크': { g: 'mask', sub: '황사 대비' },
}
const degree = (n) => Math.round(n)

export function recommendOutfit(weather, air) {
  const w = weather.today
  const band = bandFor(w.avgFeel)
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
  const uniqGear = [...new Set(gear)]

  // 기온 요약 (아침~낮 범위, 일교차 판단)
  const t = w.temps
  const lo = Math.min(t.morning, t.evening, w.min)
  const hi = Math.max(t.noon, w.max)
  const big = w.range >= 7
  const summary = `오늘 ${weather.place}의 기온은 아침 ${degree(t.morning)}도에서 낮 ${degree(t.noon)}도 사이로 예상되며, 일교차가 ${degree(w.range)}도로 ${big ? '큰 편입니다' : '크지 않은 편입니다'}. ` +
    (big ? '아침저녁으로는 쌀쌀하고 낮에는 다소 포근할 수 있으니, 얇은 옷을 여러 겹 겹쳐 입고 기온에 따라 겉옷을 조절하는 것이 좋습니다.' : '하루 종일 비슷한 옷차림으로 지내도 무난합니다.')

  // 시간대별 설명: 체감온도 대신 기온에 약간의 보정(바람)을 줘서 구간 선택
  const windAdj = w.maxWind >= 7 ? -2 : 0
  const coolBand = bandFor(Math.min(t.morning, t.evening) + windAdj)
  const dayBand = bandFor(t.noon + windAdj)
  const slots = [
    { label: '아침·저녁', temp: degree(Math.min(t.morning, t.evening)), text: `${coolBand.cards.map((c) => c.label).join(' + ')} 차림이 좋습니다.${coolBand.layer === '얇은 옷' ? ' 가벼운 겉옷을 챙기면 안심이에요.' : ''}` },
    { label: '낮', temp: degree(t.noon), text: `${dayBand.cards.map((c) => c.label).join(' + ')} 정도로 충분합니다.` },
  ]

  // 주의사항
  const cautions = []
  if (w.fogMorning) cautions.push(`오늘 ${weather.place}은 오전에 안개가 낄 수 있으니 이동·운전 시 유의하세요.`)
  if (w.pop >= 50) cautions.push(`오늘 강수확률이 ${w.pop}%예요. 우산과 방수 신발을 챙기고, 야외 일정은 실내로 바꿔 보세요.`)
  if (w.maxWind >= 10) cautions.push(`최대 풍속 ${Math.round(w.maxWind)}m/s의 강풍이 예상돼요. 해안도로·오름은 조심하세요.`)
  if (air && pmLevel >= 2) cautions.push(`미세먼지가 ${air.grade.overall.label} 수준이에요. 마스크를 쓰고 야외 활동은 줄이세요.`)
  else if (air?.yellowDust.level > 0) cautions.push('황사 기운이 있어요. 외출 후 손발·얼굴을 씻는 걸 권해요.')
  if (w.uv >= 6) cautions.push(`자외선 지수가 ${Math.round(w.uv)}로 높아요. 선크림과 모자를 챙기세요.`)
  if (w.tomorrow.pop >= 50) cautions.push(`내일은 강수확률 ${w.tomorrow.pop}%로 비가 예보돼 있어요. 오늘 외출 시 날씨 변화를 미리 확인하세요.`)
  if (!cautions.length) cautions.push('특별한 기상 주의사항은 없어요. 좋은 하루 보내세요!')

  // 날씨에 꼭 필요한 준비물(우산·마스크 등)이 있으면 옷 카드 1장을 줄여서라도 보여준다
  const PRIORITY = ['우산', 'KF94 마스크', 'KF80 마스크', '선크림', '바람막이', '방수 신발', '모자·선글라스']
  const must = PRIORITY.filter((g) => uniqGear.includes(g)).slice(0, 2).map((g) => ({ label: g, ...GEAR_CARD[g] }))
  const cards = [...band.cards.slice(0, 4 - must.length), ...must]
  return {
    title: band.title, layer: band.layer, outer, feel: w.avgFeel,
    outerText: outer ? '겉옷 챙기기' : '겉옷 없이 OK',
    pieces: band.cards.map((c) => c.label), gear: uniqGear, tips,
    headline: `${band.layer} · ${outer ? '겉옷 있으면 좋아요' : '겉옷 없이도 괜찮아요'}`,
    summary, cards, slots, cautions, range: { lo: degree(lo), hi: degree(hi) },
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
