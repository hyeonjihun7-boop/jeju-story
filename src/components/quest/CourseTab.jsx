import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { KINDS } from '../../data/spots'
import { courseText, fmt, toMin } from '../../lib/plan'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { COURSE_TAG, useQuestStore } from '../../store/useQuestStore'
import MapView from '../MapView'

async function copyLink(id, toast) {
  const url = `${location.origin}/trip/${id}`
  try { await navigator.clipboard.writeText(url); toast('공유 링크를 복사했어요') } catch { prompt('링크를 복사하세요', url) }
}

// 탐험 코스 만들기 + 탐험가들이 만든 코스 갤러리
export default function CourseTab({ spots }) {
  const toast = useAppStore((s) => s.toast)
  const { courses, saveCourse } = useQuestStore()
  const [picked, setPicked] = useState([]) // 장소 id 순서
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('09:00')
  const [stepMin, setStepMin] = useState(90)
  const [saving, setSaving] = useState(false)
  const [kind, setKind] = useState('all')
  const [gallery, setGallery] = useState({ loading: true, items: [] })

  const byId = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots])
  const list = picked.map((id) => byId.get(id)).filter(Boolean)
  const points = useMemo(() => list.map((s, i) => ({ id: s.id, kind: s.kind, name: s.name, lat: s.lat, lon: s.lon, n: i + 1, note: fmt(toMin(start) + i * stepMin), desc: s.desc })), [list, start, stepMin])

  const loadGallery = () => {
    if (!supabase) return setGallery({ loading: false, items: [], off: true })
    supabase.from('trips').select('id,title,nickname,content,created_at').contains('tools', [COURSE_TAG])
      .order('created_at', { ascending: false }).limit(12)
      .then(({ data, error }) => setGallery({ loading: false, items: data ?? [], error: error?.message }))
  }
  useEffect(loadGallery, [])

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const move = (i, d) => setPicked((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n })

  async function save() {
    if (list.length < 2) return toast('장소를 2곳 이상 골라 주세요', 'warn')
    setSaving(true)
    const t = title.trim() || `${list[0].name} → ${list[list.length - 1].name} 탐험 코스`
    const id = await saveCourse({ title: t, content: courseText(list, start, stepMin) })
    setSaving(false)
    if (!id) return
    toast('코스를 저장했어요')
    copyLink(id, toast)
    setPicked([]); setTitle('')
    loadGallery()
  }

  const shown = spots.filter((s) => kind === 'all' || s.kind === kind)

  return (
    <>
      <div className="kcard mb-3">
        <h3><i className="bi bi-signpost-split-fill" />나만의 탐험 코스 만들기</h3>
        <div className="small sub mb-2">가고 싶은 곳을 순서대로 고르면 시간표 코스가 돼요. 저장하면 공유 링크가 만들어져요.</div>
        <div className="d-flex gap-2 flex-wrap mb-2">
          <button className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>전체</button>
          {Object.entries(KINDS).map(([k, v]) => <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{v.label}</button>)}
        </div>
        <div className="q-pick">
          {shown.map((s) => {
            const n = picked.indexOf(s.id)
            return (
              <button key={s.id} className={`q-pickbtn ${n >= 0 ? 'on' : ''}`} style={{ '--c': KINDS[s.kind].color }} onClick={() => toggle(s.id)}>
                {n >= 0 ? <b>{n + 1}</b> : <i className={`bi bi-${KINDS[s.kind].icon}`} />}{s.name}
              </button>
            )
          })}
        </div>
      </div>

      {list.length > 0 && (
        <div className="kcard mb-3">
          <h3><i className="bi bi-list-ol" />내 코스 ({list.length}곳)</h3>
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6"><input className="form-control" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="코스 이름 (비우면 자동)" aria-label="코스 이름" /></div>
            <div className="col-6 col-md-3"><input type="time" className="form-control" value={start} onChange={(e) => setStart(e.target.value || '09:00')} aria-label="시작 시간" /></div>
            <div className="col-6 col-md-3">
              <select className="form-select" value={stepMin} onChange={(e) => setStepMin(Number(e.target.value))} aria-label="장소 간격">
                {[60, 90, 120, 180].map((m) => <option key={m} value={m}>장소마다 {m / 60}시간{m % 60 ? ' 30분' : ''}</option>)}
              </select>
            </div>
          </div>
          <ol className="q-route">
            {list.map((s, i) => (
              <li key={s.id}>
                <span className="trip-time">{fmt(toMin(start) + i * stepMin)}</span>
                <span className="flex-grow-1"><b>{s.name}</b> <span className="chip">{KINDS[s.kind].label}</span></span>
                <button className="q-mv" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로"><i className="bi bi-chevron-up" /></button>
                <button className="q-mv" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="아래로"><i className="bi bi-chevron-down" /></button>
                <button className="q-mv" onClick={() => toggle(s.id)} aria-label="빼기"><i className="bi bi-x-lg" /></button>
              </li>
            ))}
          </ol>
          {list.length > 1 && <div className="mb-3"><MapView points={points} route fit height={260} /></div>}
          <button className="pillbtn" disabled={saving || list.length < 2} onClick={save}>
            <i className="bi bi-share me-1" />{saving ? '저장 중…' : '저장하고 공유 링크 만들기'}
          </button>
          {list.length < 2 && <span className="small sub ms-2">2곳 이상 골라 주세요</span>}
        </div>
      )}

      {courses.length > 0 && (
        <div className="kcard mb-3">
          <h3><i className="bi bi-bookmark-star-fill" />내가 만든 코스</h3>
          {courses.map((c) => (
            <div className="row-item" key={c.id}>
              <div className="flex-grow-1"><div className="fw-bold">{c.title}</div><div className="small sub">{new Date(c.at).toLocaleDateString('ko-KR')}</div></div>
              <Link className="pillbtn ghost text-decoration-none" to={`/trip/${c.id}`}>보기</Link>
              <button className="pillbtn ghost" onClick={() => copyLink(c.id, toast)}><i className="bi bi-link-45deg" />링크 복사</button>
            </div>
          ))}
        </div>
      )}

      <div className="kcard">
        <h3><i className="bi bi-people-fill" />탐험가들이 만든 코스</h3>
        {gallery.loading ? <div className="small sub">불러오는 중…</div>
          : gallery.off ? <div className="small sub">Supabase 설정(.env.local)이 있으면 다른 탐험가의 코스를 볼 수 있어요</div>
          : gallery.error ? <div className="small text-danger">{gallery.error}</div>
          : gallery.items.length === 0 ? <div className="small sub">아직 공유된 코스가 없어요. 첫 코스를 만들어 보세요!</div>
          : <div className="q-gallery">
            {gallery.items.map((g) => {
              const stops = [...g.content.matchAll(/\|\s*(.+?)\s*\|/g)].map((m) => m[1])
              return (
                <Link key={g.id} to={`/trip/${g.id}`} className="q-course">
                  <b>{g.title}</b>
                  <small>{stops.slice(0, 4).join(' → ')}{stops.length > 4 ? ` 외 ${stops.length - 4}곳` : ''}</small>
                  <span className="sub">{g.nickname} · {new Date(g.created_at).toLocaleDateString('ko-KR')}</span>
                </Link>
              )
            })}
          </div>}
      </div>
    </>
  )
}
