import { useMemo } from 'react'
import { KINDS } from '../../data/spots'
import { useQuestStore } from '../../store/useQuestStore'
import MapView from '../MapView'

// 안개 지도: 가 본 곳은 색 핀, 아직인 곳은 물음표 핀(이름은 가려서 "찾아 나서는" 재미)
export default function QuestMap({ spots }) {
  const stamps = useQuestStore((s) => s.stamps)
  const got = useMemo(() => new Set(stamps.map((s) => s.spotId)), [stamps])
  const points = useMemo(() => spots.map((s) => got.has(s.id)
    ? { id: s.id, kind: s.kind, name: s.name, lat: s.lat, lon: s.lon, note: `${KINDS[s.kind].label}${s.ele ? ` · 해발 ${s.ele}m` : ''} · 탐험 완료`, desc: s.desc, addr: s.addr, img: s.img }
    : { id: s.id, kind: s.kind, locked: true, name: '???', lat: s.lat, lon: s.lon, note: `안개 속 ${KINDS[s.kind].label} — 찾아가서 스탬프를 찍어 보세요${s.ele && s.ele >= 300 ? ' (정상 도전!)' : ''}` }), [spots, got])
  const cleared = spots.filter((s) => got.has(s.id)).length
  const pct = spots.length ? Math.round((cleared / spots.length) * 100) : 0

  return (
    <div className="kcard p-2">
      <div className="d-flex align-items-center gap-3 px-2 pt-2 pb-1 flex-wrap">
        <h3 className="mb-0"><i className="bi bi-cloud-fog2-fill" />안개 지도</h3>
        <span className="chip">탐험 {cleared}/{spots.length}곳 · {pct}%</span>
        <div className="meter flex-grow-1" style={{ minWidth: 120 }}><span style={{ width: `${pct}%`, background: 'var(--citrus)' }} /></div>
      </div>
      <MapView points={points} height={440} />
      <div className="d-flex gap-3 flex-wrap small sub px-2 pt-2">
        {Object.entries(KINDS).map(([k, v]) => <span key={k}><i className="bi bi-circle-fill" style={{ color: v.color }} /> {v.label}</span>)}
        <span><i className="bi bi-question-circle-fill" style={{ color: '#6f7f8a' }} /> 안개 속(미방문)</span>
        <span className="ms-auto">스탬프를 찍으면 안개가 걷혀요</span>
      </div>
    </div>
  )
}
