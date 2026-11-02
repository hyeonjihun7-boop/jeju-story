import { useEffect, useMemo, useState } from 'react'
import { fetchPlaces } from '../api/client'
import MapView from './MapView'
import NaviButton from './NaviButton'

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

// 일정 한 장의 지도: 장소 이름을 위치로 바꿔 번호 핀으로 찍고 순서대로 잇는다 (버튼을 눌렀을 때만 불러온다)
function TripMap({ plan, dayIndex }) {
  const [state, setState] = useState({ loading: true })
  const rows = useMemo(() => plan.days[dayIndex].rows, [plan, dayIndex])
  useEffect(() => {
    let alive = true
    setState({ loading: true })
    fetchPlaces(rows.map((r) => r.place)).then((d) => alive && setState({ items: d.items })).catch((e) => alive && setState({ error: e.message }))
    return () => { alive = false }
  }, [rows])
  if (state.loading) return <div className="small sub py-3 text-center">장소 위치를 찾는 중…</div>
  if (state.error) return <div className="small text-danger py-2">지도를 불러오지 못했어요: {state.error}</div>
  const byName = Object.fromEntries(state.items.map((i) => [i.name, i]))
  const points = rows.map((r, i) => ({ ...byName[r.place], id: i, name: r.place, n: i + 1, note: r.time })).filter((p) => Number.isFinite(p.lat))
  const missing = rows.length - points.length
  return (
    <div className="trip-map">
      {points.length ? <MapView points={points} route fit height={260} /> : <div className="small sub py-3 text-center">지도에 표시할 수 있는 위치를 찾지 못했어요</div>}
      {missing > 0 && <div className="small sub mt-1">{missing}곳은 위치를 못 찾아 지도에 없어요 — 각 장소의 길찾기 버튼으로 찾아가세요.</div>}
    </div>
  )
}

export default function Itinerary({ plan }) {
  const [mapDay, setMapDay] = useState(null) // 지도를 연 날짜 (index)
  return (
    <div className="trip">
      {plan.days.map((d, di) => (
        <div className="trip-day" key={d.title}>
          <div className="trip-day-title">
            <i className="bi bi-calendar2-check" />{d.title}
            <button className="trip-mapbtn" onClick={() => setMapDay(mapDay === di ? null : di)}>
              <i className={`bi bi-${mapDay === di ? 'x-lg' : 'map'}`} />{mapDay === di ? '지도 닫기' : '지도로 보기'}
            </button>
          </div>
          {mapDay === di && <TripMap plan={plan} dayIndex={di} />}
          <ol className="trip-rows">
            {d.rows.map((r, i) => (
              <li key={i}>
                <span className="trip-time">{r.time}</span>
                <span className="trip-body">
                  <b>{r.place}</b>{r.desc && <small>{r.desc}</small>}
                  <NaviButton name={r.place} />
                </span>
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
