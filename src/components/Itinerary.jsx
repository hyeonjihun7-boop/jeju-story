import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { fetchDrive, fetchPlaces } from '../api/client'
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

// 위치를 못 찾은 장소도 번호 핀이 빠지지 않게, 가장 가까운 찾은 장소 옆에 "대략" 위치로 둔다 (회색 핀으로 구분)
function withApprox(list) {
  const known = (p) => Number.isFinite(p.lat)
  return list.map((p, i) => {
    if (known(p)) return p
    const ref = [...list.slice(0, i).reverse(), ...list.slice(i + 1)].find(known) ?? { lat: 33.4996, lon: 126.5312 } // 없으면 제주시
    const a = i * 2.4
    return { ...p, lat: ref.lat + 0.012 * Math.sin(a), lon: ref.lon + 0.015 * Math.cos(a), approx: true }
  })
}

// 일정 한 장의 지도: 장소 이름을 위치로 바꿔 번호 핀으로 찍고 순서대로 잇는다 (버튼을 눌렀을 때만 불러온다)
function TripMap({ plan, dayIndex, onLegs }) {
  const [state, setState] = useState({ loading: true })
  const rows = useMemo(() => plan.days[dayIndex].rows, [plan, dayIndex])
  useEffect(() => {
    let alive = true
    setState({ loading: true })
    fetchPlaces(rows.map((r) => r.place)).then(async (d) => {
      if (!alive) return
      setState({ items: d.items })
      // 위치를 찾은 장소끼리 자동차 이동 시간을 구해 시간표에 알려준다 (실패해도 지도는 그대로)
      const byName = Object.fromEntries(d.items.map((i) => [i.name, i]))
      const found = rows.map((r, i) => ({ i, ...byName[r.place] })).filter((p) => Number.isFinite(p.lat))
      if (found.length < 2) return onLegs(dayIndex, {})
      const { legs } = await fetchDrive(found).catch(() => ({ legs: [] }))
      if (!alive) return
      onLegs(dayIndex, Object.fromEntries(legs.map((l, k) => [found[k].i, { ...l, to: rows[found[k + 1].i].place }])))
    }).catch((e) => alive && setState({ error: e.message }))
    return () => { alive = false }
  }, [rows, dayIndex, onLegs])
  if (state.loading) return <div className="small sub py-3 text-center">장소 위치를 찾는 중…</div>
  if (state.error) return <div className="small text-danger py-2">지도를 불러오지 못했어요: {state.error}</div>
  const byName = Object.fromEntries(state.items.map((i) => [i.name, i]))
  const points = withApprox(rows.map((r, i) => ({ ...byName[r.place], id: i, name: r.place, n: i + 1, note: r.time })))
  const missing = points.filter((p) => p.approx).length
  return (
    <div className="trip-map">
      <MapView points={points} route fit height={260} />
      {missing > 0 && <div className="small sub mt-1">회색 핀 {missing}곳은 정확한 위치를 못 찾아 대략 표시했어요 — 각 장소의 길찾기 버튼으로 정확한 위치를 확인하세요.</div>}
    </div>
  )
}

// 시간표를 사진(PNG)으로: 버튼·지도는 빼고 시간표만 담는다. 모바일은 공유 창, 그 외엔 내려받기
async function saveImage(node, title) {
  const dataUrl = await toPng(node, {
    pixelRatio: 2, backgroundColor: '#ffffff', // 숨길 요소는 .capturing CSS 로 접어서 빈칸이 남지 않게 한다
  })
  const name = `${(title || '제주 일정').replace(/[\\/:*?"<>|\s]+/g, '_')}.png`
  const file = new File([await (await fetch(dataUrl)).blob()], name, { type: 'image/png' })
  if (/Mobi|Android/i.test(navigator.userAgent) && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: title || '제주 일정' })
    return
  }
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = name
  a.click()
}

export default function Itinerary({ plan, title }) {
  const [mapDay, setMapDay] = useState(null) // 지도를 연 날짜 (index)
  const [legs, setLegs] = useState({}) // 날짜 → 행 번호 → 다음 장소까지 이동 시간
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const box = useRef(null)
  const onLegs = useMemo(() => (di, v) => setLegs((p) => ({ ...p, [di]: v })), [])

  async function save() {
    setSaving(true)
    setSaveError('')
    box.current.classList.add('capturing') // 사진에만 일정 제목을 넣는다
    try { await saveImage(box.current, title) } catch (e) { if (e?.name !== 'AbortError') setSaveError('이미지를 만들지 못했어요') }
    box.current.classList.remove('capturing')
    setSaving(false)
  }

  return (
    <div className="trip" ref={box}>
      {title && <div className="trip-capture-title">{title}</div>}
      {plan.days.map((d, di) => (
        <div className="trip-day" key={d.title}>
          <div className="trip-day-title">
            <i className="bi bi-calendar2-check" />{d.title}
            <button className="trip-mapbtn" data-nocapture="1" onClick={() => setMapDay(mapDay === di ? null : di)}>
              <i className={`bi bi-${mapDay === di ? 'x-lg' : 'map'}`} />{mapDay === di ? '지도 닫기' : '지도로 보기'}
            </button>
          </div>
          {mapDay === di && <div data-nocapture="1"><TripMap plan={plan} dayIndex={di} onLegs={onLegs} /></div>}
          <ol className="trip-rows">
            {d.rows.map((r, i) => (
              <li key={i}>
                <span className="trip-time">{r.time}</span>
                <span className="trip-body">
                  <b>{r.place}</b>{r.desc && <small>{r.desc}</small>}
                  <span data-nocapture="1"><NaviButton name={r.place} /></span>
                  {legs[di]?.[i] && <span className="trip-leg"><i className="bi bi-car-front-fill" />다음 {legs[di][i].to}까지 차로 약 {legs[di][i].min}분 · {legs[di][i].km}km</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {plan.notes.length > 0 && (
        <ul className="trip-notes">{plan.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}
      <div className="trip-save" data-nocapture="1">
        <button className="trip-mapbtn" disabled={saving} onClick={save}><i className="bi bi-image" />{saving ? '만드는 중…' : '이미지로 저장'}</button>
        {saveError && <span className="small text-danger ms-2">{saveError}</span>}
      </div>
    </div>
  )
}
