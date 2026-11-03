import { useMemo, useRef, useState } from 'react'
import { KINDS } from '../../data/spots'
import { useAppStore } from '../../store/useAppStore'
import { useQuestStore } from '../../store/useQuestStore'
import MapView from '../MapView'

// 사진을 작게 줄여(긴 변 560px, JPEG) 글자 데이터로 — 이 기기 저장 공간을 아끼려고
function shrink(file, max = 560) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('사진을 읽지 못했어요')) }
    img.src = url
  })
}

// 탐험 일지: 장소마다 사진 한 장 + 한 줄 메모 → 시간순 타임라인과 지도
export default function JournalTab({ spots }) {
  const toast = useAppStore((s) => s.toast)
  const { journal, stamps, addJournal, removeJournal } = useQuestStore()
  const [spotId, setSpotId] = useState('')
  const [place, setPlace] = useState('')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState('')
  const fileRef = useRef(null)

  const byId = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots])
  const stampedIds = new Set(stamps.map((s) => s.spotId))
  const mine = spots.filter((s) => stampedIds.has(s.id))
  const rest = spots.filter((s) => !stampedIds.has(s.id))

  async function pick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    try { setPhoto(await shrink(f)) } catch (err) { toast(err.message, 'warn') }
    e.target.value = ''
  }
  function save() {
    const spot = byId.get(spotId)
    const name = spot?.name ?? place.trim()
    if (!name) return toast('장소를 고르거나 적어 주세요', 'warn')
    if (!text.trim() && !photo) return toast('한 줄 메모나 사진을 남겨 주세요', 'warn')
    addJournal({ spotId: spot?.id ?? null, place: name, text: text.trim(), photo, lat: spot?.lat ?? null, lon: spot?.lon ?? null })
    setText(''); setPhoto(''); setPlace('')
    toast('일지에 남겼어요')
  }

  // 타임라인 지도: 오래된 순서로 번호를 붙여 이어 준다 (위치를 아는 기록만)
  const ordered = useMemo(() => [...journal].sort((a, b) => a.at.localeCompare(b.at)), [journal])
  const points = useMemo(() => ordered.filter((j) => Number.isFinite(j.lat)).map((j, i) => ({
    id: j.id, kind: byId.get(j.spotId)?.kind ?? 'tour', name: j.place, lat: j.lat, lon: j.lon, n: i + 1,
    note: new Date(j.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }), desc: j.text, img: j.photo.startsWith('data:') ? '' : j.photo,
  })), [ordered, byId])

  return (
    <>
      <div className="kcard mb-3">
        <h3><i className="bi bi-journal-richtext" />탐험 일지 쓰기</h3>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <select className="form-select" value={spotId} onChange={(e) => setSpotId(e.target.value)} aria-label="장소">
              <option value="">장소 고르기 (또는 아래에 직접 입력)</option>
              {mine.length > 0 && <optgroup label="스탬프 찍은 곳">{mine.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>}
              <optgroup label="그 밖의 장소">{rest.map((s) => <option key={s.id} value={s.id}>{s.name} · {KINDS[s.kind].label}</option>)}</optgroup>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <input className="form-control" value={place} disabled={!!spotId} maxLength={30} onChange={(e) => setPlace(e.target.value)} placeholder="목록에 없는 장소 이름 (지도에는 표시되지 않아요)" aria-label="장소 이름" />
          </div>
          <div className="col-12">
            <input className="form-control" value={text} maxLength={80} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save() }} placeholder="한 줄 메모 (80자)" aria-label="한 줄 메모" />
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
          <button className="pillbtn ghost" onClick={() => fileRef.current?.click()}><i className="bi bi-camera-fill me-1" />{photo ? '사진 바꾸기' : '사진 한 장'}</button>
          {photo && <><img className="q-thumb" src={photo} alt="선택한 사진" /><button className="btn btn-link small p-0" onClick={() => setPhoto('')}>사진 빼기</button></>}
          <button className="pillbtn ms-auto" onClick={save}><i className="bi bi-pencil-fill me-1" />일지에 남기기</button>
        </div>
        <div className="src">일지와 사진은 이 기기(브라우저)에만 저장돼요. 사진은 작게 줄여서 저장해요.</div>
      </div>

      {points.length > 0 && (
        <div className="kcard p-2 mb-3">
          <h3 className="px-2 pt-2"><i className="bi bi-map-fill" />내 탐험 지도 <span className="chip ms-1">{points.length}곳</span></h3>
          <MapView points={points} route fit height={320} />
        </div>
      )}

      <div className="kcard">
        <h3><i className="bi bi-clock-history" />탐험 타임라인 <span className="chip ms-1">{journal.length}개</span></h3>
        {journal.length === 0 ? <div className="small sub">아직 기록이 없어요. 오늘 본 것을 한 줄 남겨 보세요.</div> : (
          <ol className="q-timeline">
            {journal.map((j) => (
              <li key={j.id}>
                <div className="q-tl-date">{new Date(j.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="q-tl-card">
                  <div className="d-flex align-items-start gap-2">
                    <b className="flex-grow-1">{j.place}</b>
                    <button className="q-mv" onClick={() => { if (confirm('이 기록을 지울까요?')) removeJournal(j.id) }} aria-label="기록 지우기"><i className="bi bi-trash3" /></button>
                  </div>
                  {j.text && <div>{j.text}</div>}
                  {j.photo && <img className="q-tl-img" src={j.photo} alt={`${j.place} 사진`} />}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  )
}
