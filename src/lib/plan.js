// 장소 목록 → 시간표 일정 글. AI 일정과 같은 형식(## N일차 / - 시간 | 장소 | 설명)이라
// 일정 화면(Itinerary)과 공유 링크(/trip/:id)가 그대로 읽는다.
export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const clean = (t) => String(t ?? '').replace(/[|｜\n]/g, ' ').trim()

// places = [{ name, desc }] 순서대로, start("09:00") 부터 stepMin 분 간격
export function courseText(places, start, stepMin, heading = '탐험 코스') {
  const t0 = toMin(start)
  return [`## 1일차 (${heading})`, ...places.map((s, i) => `- ${fmt(t0 + i * stepMin)} | ${clean(s.name)} | ${clean(s.desc)}`)].join('\n')
}
