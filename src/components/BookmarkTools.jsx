import { useMemo, useRef, useState } from 'react'
import { courseText, fmt, toMin } from '../lib/plan'
import { shareNodeAsImage } from '../lib/shareImage'
import { useAppStore } from '../store/useAppStore'
import Itinerary, { parseItinerary } from './Itinerary'

const EMOJI = { oreum: '⛰️', olle: '🚶', indoor: '🏛️', tour: '🏞️', festival: '🎉', brand: '🛍️', restaurant: '🍽️', news: '📰' }
const PLACE_KINDS = new Set(['oreum', 'olle', 'indoor', 'tour', 'festival', 'restaurant']) // 일정에 넣을 수 있는 장소 종류

// 북마크로 하는 두 가지: ① 모음 카드를 이미지로 저장 ② 고른 곳으로 여행 계획을 만들어 공유 링크 만들기
export default function BookmarkTools({ items, kindLabel }) {
  const nickname = useAppStore((s) => s.nickname) || '익명 탐험가'
  const toast = useAppStore((s) => s.toast)
  const saveTrip = useAppStore((s) => s.saveTrip)
  const [open, setOpen] = useState('') // '' | 'card' | 'plan'
  const [picked, setPicked] = useState([]) // 북마크 id 순서
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('09:00')
  const [stepMin, setStepMin] = useState(90)
  const [busy, setBusy] = useState('')
  const cardRef = useRef(null)

  const places = items.filter((f) => PLACE_KINDS.has(f.kind))
  const byId = useMemo(() => new Map(items.map((f) => [f.id, f])), [items])
  const chosen = picked.map((id) => byId.get(id)).filter(Boolean)
  const text = useMemo(
    () => courseText(chosen.map((f) => ({ name: f.title, desc: f.note || kindLabel[f.kind] || '' })), start, stepMin, '북마크 여행 계획'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picked, items, start, stepMin],
  )
  const plan = chosen.length >= 2 ? parseItinerary(text) : null
  const planTitle = title.trim() || (chosen.length ? `${chosen[0].title} 외 ${chosen.length - 1}곳 여행 계획` : '')

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const move = (i, d) => setPicked((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n })

  // 종류별로 묶은 북마크 (카드용)
  const groups = useMemo(() => {
    const m = new Map()
    items.forEach((f) => m.set(f.kind, [...(m.get(f.kind) ?? []), f]))
    return [...m.entries()]
  }, [items])

  async function saveCardImage() {
    setBusy('img')
    try { await shareNodeAsImage(cardRef.current, `${nickname}_북마크`) }
    catch (e) { if (e?.name !== 'AbortError') toast('이미지를 만들지 못했어요', 'danger') }
    setBusy('')
  }

  async function savePlan() {
    if (!plan) return toast('장소를 2곳 이상 골라 주세요', 'warn')
    setBusy('plan')
    const ok = await saveTrip({ title: planTitle, question: '북마크로 만든 여행 계획', content: text, tools: ['bookmark-plan'] })
    setBusy('')
    if (!ok) return
    const t = useAppStore.getState().trips[0] // 방금 저장한 일정
    const url = `${location.origin}/trip/${t.id}`
    try { await navigator.clipboard.writeText(url); toast('공유 링크를 복사했어요') } catch { toast(url) }
    setPicked([]); setTitle('')
  }

  return (
    <div className="bm-tools mb-3">
      <div className="d-flex gap-2 flex-wrap">
        <button className={`pillbtn ${open === 'card' ? '' : 'ghost'}`} onClick={() => setOpen(open === 'card' ? '' : 'card')}>
          <i className="bi bi-image me-1" />북마크 카드 이미지
        </button>
        <button className={`pillbtn ${open === 'plan' ? '' : 'ghost'}`} onClick={() => setOpen(open === 'plan' ? '' : 'plan')}>
          <i className="bi bi-signpost-split me-1" />북마크로 여행 계획 만들기
        </button>
      </div>

      {open === 'card' && (
        <div className="mt-3">
          <div className="bm-card" ref={cardRef}>
            <div className="bm-brand">🍊 탐험 제주</div>
            <div className="bm-title">{nickname}의 제주 북마크</div>
            <div className="bm-count">{items.length}곳을 담았어요</div>
            <div className="bm-groups">
              {groups.map(([k, list]) => (
                <div key={k} className="bm-group">
                  <b>{EMOJI[k] ?? '📍'} {kindLabel[k] ?? k} <span>{list.length}</span></b>
                  <ul>
                    {list.slice(0, 5).map((f) => <li key={f.id}>{f.title}</li>)}
                    {list.length > 5 && <li className="more">외 {list.length - 5}곳</li>}
                  </ul>
                </div>
              ))}
            </div>
            <div className="bm-foot">jeju-story.vercel.app · {new Date().toLocaleDateString('ko-KR')}</div>
          </div>
          <div className="text-end mt-2">
            <button className="pillbtn" disabled={busy === 'img'} onClick={saveCardImage}><i className="bi bi-download me-1" />{busy === 'img' ? '만드는 중…' : '이미지로 저장·공유'}</button>
          </div>
          <div className="small sub mt-1">지금 보고 있는 분류의 북마크가 카드에 담겨요. 분류 버튼으로 골라 보세요.</div>
        </div>
      )}

      {open === 'plan' && (
        <div className="mt-3">
          {places.length < 2 ? <div className="small sub">일정에 넣을 수 있는 북마크(오름·올레·실내·관광지·행사·맛집)가 2곳 이상 있어야 해요.</div> : (
            <>
              <div className="small sub mb-2">가고 싶은 곳을 순서대로 눌러 고르세요. 시간표로 바뀌고, 이미지 저장과 공유 링크를 만들 수 있어요.</div>
              <div className="q-pick mb-3">
                {places.map((f) => {
                  const n = picked.indexOf(f.id)
                  return (
                    <button key={f.id} className={`q-pickbtn ${n >= 0 ? 'on' : ''}`} style={{ '--c': '#2c6b55' }} onClick={() => toggle(f.id)}>
                      {n >= 0 ? <b>{n + 1}</b> : <span aria-hidden="true">{EMOJI[f.kind] ?? '📍'}</span>}{f.title}
                    </button>
                  )
                })}
              </div>
              {chosen.length > 0 && (
                <>
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6"><input className="form-control" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="계획 이름 (비우면 자동)" aria-label="계획 이름" /></div>
                    <div className="col-6 col-md-3"><input type="time" className="form-control" value={start} onChange={(e) => setStart(e.target.value || '09:00')} aria-label="시작 시간" /></div>
                    <div className="col-6 col-md-3">
                      <select className="form-select" value={stepMin} onChange={(e) => setStepMin(Number(e.target.value))} aria-label="장소 간격">
                        {[60, 90, 120, 180].map((m) => <option key={m} value={m}>장소마다 {m / 60}시간{m % 60 ? ' 30분' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                  <ol className="q-route">
                    {chosen.map((f, i) => (
                      <li key={f.id}>
                        <span className="trip-time">{fmt(toMin(start) + i * stepMin)}</span>
                        <span className="flex-grow-1"><b>{f.title}</b> <span className="chip">{kindLabel[f.kind] ?? f.kind}</span></span>
                        <button className="q-mv" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로"><i className="bi bi-chevron-up" /></button>
                        <button className="q-mv" onClick={() => move(i, 1)} disabled={i === chosen.length - 1} aria-label="아래로"><i className="bi bi-chevron-down" /></button>
                        <button className="q-mv" onClick={() => toggle(f.id)} aria-label="빼기"><i className="bi bi-x-lg" /></button>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {plan && <Itinerary plan={plan} title={planTitle} />}
              <button className="pillbtn" disabled={busy === 'plan' || !plan} onClick={savePlan}>
                <i className="bi bi-share me-1" />{busy === 'plan' ? '저장 중…' : '저장하고 공유 링크 만들기'}
              </button>
              {!plan && <span className="small sub ms-2">2곳 이상 골라 주세요</span>}
              {plan && <div className="small sub mt-1">저장하면 위의 “내 여행 일정”에도 나타나고, 링크로 누구에게나 보여 줄 수 있어요.</div>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
