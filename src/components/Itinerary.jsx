// AI 가 정해진 형식으로 쓴 일정 글을 시간표 카드로 바꿔 보여준다
//   ## 1일차 (맑음, 18°)
//   - 09:00 | 장소 | 한 줄 설명
// 형식이 아니면 parseItinerary 가 null 을 돌려주고, 화면은 평범한 글로 보여준다.
const ROW = /^\s*[-*•]?\s*(\d{1,2}:\d{2})\s*[|｜]\s*(.+?)\s*(?:[|｜]\s*(.*))?$/
const DAY = /^\s*(?:#{1,4}\s*|\*\*)\s*(.+?)\s*(?:\*\*)?\s*$/

export function parseItinerary(text) {
  if (!text) return null
  const days = []
  const notes = []
  let cur = null
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) continue
    const row = line.replace(/\*\*/g, '').match(ROW) // AI 가 시간·장소를 굵게(**) 써도 읽는다
    if (row) {
      if (!cur) { cur = { title: '일정', rows: [] }; days.push(cur) }
      cur.rows.push({ time: row[1].padStart(5, '0'), place: row[2].replace(/\*\*/g, ''), desc: (row[3] ?? '').replace(/\*\*/g, '') })
      continue
    }
    const day = line.match(DAY)
    if (day && /일차|Day|day|당일|첫째|둘째/.test(day[1])) {
      cur = { title: day[1].replace(/\*\*/g, ''), rows: [] }
      days.push(cur)
      continue
    }
    notes.push(line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, ''))
  }
  const total = days.reduce((n, d) => n + d.rows.length, 0)
  return total >= 2 ? { days: days.filter((d) => d.rows.length), notes } : null
}

export default function Itinerary({ plan }) {
  return (
    <div className="trip">
      {plan.days.map((d) => (
        <div className="trip-day" key={d.title}>
          <div className="trip-day-title"><i className="bi bi-calendar2-check" />{d.title}</div>
          <ol className="trip-rows">
            {d.rows.map((r, i) => (
              <li key={i}>
                <span className="trip-time">{r.time}</span>
                <span className="trip-body"><b>{r.place}</b>{r.desc && <small>{r.desc}</small>}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {plan.notes.length > 0 && (
        <ul className="trip-notes">{plan.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}
    </div>
  )
}
