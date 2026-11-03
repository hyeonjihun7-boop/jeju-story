import { useState } from 'react'
import { OLLE_ASOF, OLLE_POINTS, OLLE_SITE } from '../../data/olle'
import { distanceM, fmtDist, getPosition, MAX_ACC } from '../../lib/quest'
import { olleNewlyCompleted, olleProgress } from '../../lib/trail'
import { useAppStore } from '../../store/useAppStore'
import { useQuestStore } from '../../store/useQuestStore'
import NaviButton from '../NaviButton'
import { useFxStore } from '../../store/useFxStore'

// 제주올레 공식 코스(공공데이터) 완주 도전: 코스의 시작점과 종점을 GPS로 인증하면 완주
export default function OlleCourses({ demo }) {
  const olle = useQuestStore((s) => s.olle)
  const addOlle = useQuestStore((s) => s.addOlle)
  const toast = useAppStore((s) => s.toast)
  const fire = useFxStore((s) => s.fire)
  const [busy, setBusy] = useState('')

  const courses = olleProgress(olle)
  const gps = courses.filter((c) => c.hasGps)
  const info = courses.filter((c) => !c.hasGps)
  const got = new Map(olle.map((o) => [o.pointId, o]))

  async function certify(id) {
    const pt = OLLE_POINTS[id]
    if (got.has(id)) return
    const done = () => {
      const finished = olleNewlyCompleted(olle, id)
      addOlle(id, demo)
      if (finished.length) fire('badge', { title: '올레 완주!', sub: `올레 ${finished.map((c) => c.no).join('·')}코스` })
      else fire('stamp', { title: '인증 완료!', sub: pt.name })
      toast(finished.length ? `🏅 올레 ${finished.map((c) => c.no + '코스').join('·')} 완주!${demo ? ' (데모)' : ''}` : `${pt.name} 인증${demo ? ' (데모)' : ' 완료!'}`)
    }
    if (demo) return done()
    setBusy(id)
    try {
      const p = await getPosition()
      if (p.acc > MAX_ACC) toast(`GPS 정확도가 낮아요 (오차 약 ${fmtDist(p.acc)}). 하늘이 트인 곳에서 다시 시도해 주세요`, 'warn')
      else {
        const d = distanceM(p, pt)
        if (d <= pt.r + Math.min(p.acc ?? 0, 150)) done()
        else toast(`${pt.name}까지 ${fmtDist(d)} 남았어요 (반경 ${fmtDist(pt.r)} 안에서 인증)`, 'warn')
      }
    } catch (e) { toast(e.message, 'warn') }
    setBusy('')
  }

  const point = (id, label) => {
    const pt = OLLE_POINTS[id], hit = got.get(id)
    return (
      <div className={`q-opt ${hit ? 'on' : ''}`}>
        <span className="q-opt-l">{label}</span>
        <b>{pt.name}</b>
        {hit
          ? <span className="q-ok"><i className="bi bi-check-circle-fill" /> {new Date(hit.at).toLocaleDateString('ko-KR')}{hit.demo ? ' (데모)' : ''}</span>
          : <span className="d-flex gap-2 align-items-center flex-wrap">
            <button className="pillbtn" disabled={busy === id} onClick={() => certify(id)}>{busy === id ? '확인 중…' : demo ? '인증 (데모)' : '여기서 인증'}</button>
            <NaviButton name={pt.name} lat={pt.lat} lon={pt.lon} label="길찾기" />
          </span>}
      </div>
    )
  }

  return (
    <div className="kcard mb-3">
      <h3><i className="bi bi-signpost-2-fill" />제주올레 코스 완주 <span className="chip ms-1">{gps.filter((c) => c.complete).length}/{gps.length} 완주</span></h3>
      <p className="small sub mb-3">공식 코스(제주올레 제공 공공데이터)의 <b>시작점과 종점을 모두 GPS로 인증</b>하면 완주 배지가 붙어요. 걸은 경로 전체를 확인하는 건 아니고, 이어진 코스는 지점 하나를 두 코스가 함께 써요.</p>
      <div className="q-oll">
        {gps.map((c) => (
          <div key={c.no} className={`q-olle ${c.complete ? 'done' : ''}`}>
            <div className="q-olle-head">
              <span className="q-olle-no">{c.no}</span>
              <div className="flex-grow-1">
                <div className="fw-bold">{c.name}</div>
                <div className="small sub">{c.km}km · {c.time}</div>
              </div>
              {c.complete && <span className="q-olle-ok"><i className="bi bi-award-fill" /> 완주</span>}
            </div>
            <div className="q-olle-pts">{point(c.a, '시작')}{point(c.b, '종점')}</div>
          </div>
        ))}
      </div>
      <details className="q-olle-info mt-3">
        <summary>좌표를 확인 못 한 코스 {info.length}개 (안내만)</summary>
        <div className="small sub mt-2">용수포구·저지예술정보화마을·간세라운지·가파도는 한국관광공사와 OpenStreetMap에서 서로 맞는 좌표를 찾지 못해 GPS 인증을 붙이지 않았어요. 코스 정보만 보여 드려요.</div>
        <ul className="q-olle-list">
          {info.map((c) => <li key={c.no}><b>{c.no}코스</b> {c.from} → {c.to} <span className="sub">· {c.km}km · {c.time}</span></li>)}
        </ul>
      </details>
      <div className="src">코스 정보: 공공데이터포털 「제주특별자치도_올레코스현황」(제주올레 제공, {OLLE_ASOF} 기준) · 상세 경로는 <a href={OLLE_SITE} target="_blank" rel="noreferrer">제주올레 공식 사이트</a>. 시종점 좌표는 한국관광공사 TourAPI와 OpenStreetMap으로 대조한 값이에요. 이 기기에만 저장돼요.</div>
    </div>
  )
}
