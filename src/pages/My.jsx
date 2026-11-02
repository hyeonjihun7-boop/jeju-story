import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isSupabaseReady, supabase } from '../lib/supabase'
import { fetchPlaces } from '../api/client'
import FavButton from '../components/FavButton'
import Itinerary, { parseItinerary } from '../components/Itinerary'
import MapView from '../components/MapView'
import { Empty, Loading } from '../components/Status'

const KIND = { oreum: '오름', olle: '올레', indoor: '실내', tour: '관광지', festival: '행사', brand: '브랜드', restaurant: '맛집', news: '뉴스' }
const MAPPABLE = new Set(['oreum', 'olle', 'indoor', 'tour', 'festival', 'restaurant'])
const PIN = { oreum: 'oreum', olle: 'olle', indoor: 'indoor', tour: 'tour', festival: 'tour', restaurant: 'food' }

// 북마크를 지도에 한꺼번에: 제목으로 위치를 찾아 종류별 색 핀으로 보여준다 (버튼을 눌렀을 때만 불러온다)
function FavMap({ items }) {
  const [state, setState] = useState({ loading: true })
  const names = useMemo(() => [...new Set(items.filter((f) => MAPPABLE.has(f.kind)).map((f) => f.title))], [items])
  useEffect(() => {
    let alive = true
    setState({ loading: true })
    const chunks = []
    for (let i = 0; i < names.length; i += 12) chunks.push(names.slice(i, i + 12))
    Promise.all(chunks.map((c) => fetchPlaces(c))).then((r) => alive && setState({ found: r.flatMap((x) => x.items) }))
      .catch((e) => alive && setState({ error: e.message }))
    return () => { alive = false }
  }, [names])
  if (state.loading) return <div className="small sub py-3 text-center">북마크한 곳의 위치를 찾는 중…</div>
  if (state.error) return <div className="small text-danger py-2">지도를 불러오지 못했어요: {state.error}</div>
  const by = Object.fromEntries(state.found.map((x) => [x.name, x]))
  const points = items.filter((f) => MAPPABLE.has(f.kind) && Number.isFinite(by[f.title]?.lat))
    .map((f) => ({ id: f.id, kind: PIN[f.kind] ?? 'tour', name: f.title, lat: by[f.title].lat, lon: by[f.title].lon, note: KIND[f.kind] }))
  const shown = new Set(points.map((p) => p.name))
  const missing = names.filter((n) => !shown.has(n)).length
  return (
    <div className="mb-3">
      {points.length ? <MapView points={points} fit height={300} /> : <div className="small sub py-3 text-center">지도에 표시할 수 있는 위치를 찾지 못했어요</div>}
      <div className="small sub mt-1">지도에 {points.length}곳{missing > 0 ? ` · 위치를 못 찾은 ${missing}곳은 목록의 길찾기로 찾아가세요` : ''}. 뉴스·브랜드는 지도에 표시하지 않아요.</div>
    </div>
  )
}

export default function My() {
  const { nickname, setNickname, favorites, favLoading, loadFavorites, trips, tripsLoading, tripsError, loadTrips, deleteTrip, toast } = useAppStore()
  const [logs, setLogs] = useState([])
  const [draft, setDraft] = useState(nickname)
  const [kind, setKind] = useState('전체')
  const [showMap, setShowMap] = useState(false)

  useEffect(() => { loadTrips() }, [nickname, loadTrips])
  useEffect(() => {
    if (!supabase) return
    supabase.from('chat_logs').select('*').eq('nickname', nickname || '익명').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setLogs(data ?? []))
  }, [nickname])

  // 공유 링크 복사 (모바일은 공유 창, 그 외엔 클립보드)
  async function shareTrip(t) {
    const url = `${location.origin}/trip/${t.id}`
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) await navigator.share({ title: t.title, url })
      else { await navigator.clipboard.writeText(url); toast('공유 링크를 복사했어요') }
    } catch { toast(url) }
  }

  const kinds = ['전체', ...new Set(favorites.map((f) => f.kind))]
  const list = favorites.filter((f) => kind === '전체' || f.kind === kind)

  return (
    <>
      <div className="mb-3">
        <h1 className="headline">내가 담아 둔 <em>제주</em></h1>
        <div className="sub mb-3">Supabase에 저장돼서 새로고침해도 남아요</div>
        <form className="d-flex gap-2" style={{ maxWidth: 360 }} onSubmit={(e) => { e.preventDefault(); setNickname(draft); loadFavorites() }}>
          <input className="form-control rounded-pill px-3" placeholder="닉네임" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="pillbtn">저장</button>
        </form>
        {!isSupabaseReady && <div className="small text-danger mt-2">VITE_SUPABASE_URL / ANON_KEY 가 없어서 저장 기능이 꺼져 있어요 (.env.local)</div>}
      </div>

      <div className="kcard mb-3">
        <h3><i className="bi bi-calendar2-heart" />내 여행 일정 <span className="chip ms-1">{trips.length}개</span></h3>
        {tripsError && <div className="small text-danger mb-2">{tripsError}</div>}
        {tripsLoading ? <Loading /> : trips.length === 0 ? (
          <Empty text="저장한 일정이 없어요" hint="AI 비서에게 “1박 2일 일정 짜줘”라고 묻고 ‘내 일정에 저장’을 눌러보세요" />
        ) : trips.map((t) => {
          const plan = parseItinerary(t.content)
          return (
            <div key={t.id} className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="fw-bold flex-grow-1">{t.title}</div>
                <span className="small sub">{new Date(t.created_at).toLocaleDateString('ko-KR')}</span>
                <button className="trip-mapbtn" onClick={() => shareTrip(t)}><i className="bi bi-share" />공유 링크</button>
                <button className="favbtn" aria-label="일정 삭제" onClick={() => deleteTrip(t.id)}><i className="bi bi-trash" /></button>
              </div>
              {plan ? <Itinerary plan={plan} title={t.title} /> : <div className="msg assistant">{t.content}</div>}
              {t.tools?.length > 0 && <div className="small sub">사용한 도구: {[...new Set(t.tools)].join(', ')}</div>}
            </div>
          )
        })}
      </div>

      {favLoading ? <Loading /> : favorites.length === 0 ? <Empty text="아직 담은 곳이 없어요" hint="카드의 북마크 버튼을 눌러보세요" /> : (
        <div className="kcard mb-3">
          <h3><i className="bi bi-bookmark-heart" />북마크 <span className="chip ms-1">{list.length}곳</span></h3>
          <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
            {kinds.map((k) => (
              <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{k === '전체' ? '전체' : KIND[k] ?? k}</button>
            ))}
            <button className="trip-mapbtn" onClick={() => setShowMap(!showMap)}>
              <i className={`bi bi-${showMap ? 'x-lg' : 'map'}`} />{showMap ? '지도 닫기' : '지도에서 한꺼번에 보기'}
            </button>
          </div>
          {showMap && <FavMap items={list} />}
          {list.map((f) => (
            <div className="row-item" key={f.id}>
              <span className="chip">{KIND[f.kind] ?? f.kind}</span>
              <div className="flex-grow-1"><div className="fw-bold">{f.title}</div><div className="small sub">{f.note}</div></div>
              <FavButton kind={f.kind} id={f.item_id} title={f.title} note={f.note} />
            </div>
          ))}
        </div>
      )}
      {logs.length > 0 && (
        <div className="kcard">
          <h3><i className="bi bi-chat-dots" />최근 AI 대화 기록</h3>
          {logs.map((l) => (
            <div key={l.id} className="row-item d-block">
              <div className="fw-bold">Q. {l.question}</div>
              <div className="small sub">도구: {l.tools?.join(', ') || '없음'}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
