import { useEffect, useState } from 'react'
import { fetchFood, fetchShops } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import PlacePicker from '../components/PlacePicker'
import FavButton from '../components/FavButton'
import MapView from '../components/MapView'
import { Empty, ErrorBox, Loading } from '../components/Status'

const CATS = [
  { key: 'snack', label: '간식·디저트', icon: 'cookie' },
  { key: 'fashion', label: '로컬 의류', icon: 'tags' },
  { key: 'acc', label: '액세서리·소품', icon: 'gem' },
  { key: 'near', label: '주변 맛집·카페', icon: 'geo-alt' },
]

function Brands({ cat }) {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    setState({ loading: true })
    fetchShops(cat).then((d) => setState({ items: d.items })).catch((e) => setState({ error: e.message }))
  }, [cat])
  if (state.loading) return <Loading />
  if (state.error) return <ErrorBox error={state.error} />
  return (
    <div className="d-grid gap-3">
      {state.items.map((s) => (
        <div className="kcard" key={s.id}>
          <div className="d-flex align-items-start gap-2">
            <div className="flex-grow-1">
              <div className="fw-bold fs-5">{s.name}</div>
              <div className="small sub"><i className="bi bi-geo-alt" /> {s.area}</div>
            </div>
            <FavButton kind="brand" id={s.id} title={s.name} note={s.area} />
          </div>
          <div className="d-flex gap-1 flex-wrap my-2">{s.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
          <p className="mb-3 small">{s.desc}</p>
          <div className="d-flex gap-2 flex-wrap">
            <a className="pillbtn ghost text-decoration-none" href={s.mapUrl} target="_blank" rel="noreferrer"><i className="bi bi-map me-1" />위치</a>
            <a className="pillbtn text-decoration-none" href={s.buyUrl} target="_blank" rel="noreferrer"><i className="bi bi-credit-card me-1" />구매·결제</a>
            {s.reserveUrl && <a className="pillbtn ghost text-decoration-none" href={s.reserveUrl} target="_blank" rel="noreferrer"><i className="bi bi-hourglass-split me-1" />예약·대기</a>}
          </div>
        </div>
      ))}
      <div className="src">큐레이션 목록 · 영업·재고는 방문 전 확인하세요</div>
    </div>
  )
}

function Nearby() {
  const place = useAppStore((s) => s.place)
  const [kind, setKind] = useState('restaurant')
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    setState({ loading: true })
    fetchFood(place, kind).then(setState).catch((e) => setState({ error: e.message }))
  }, [place, kind])
  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        <button className={`chip ${kind === 'restaurant' ? 'on' : ''}`} onClick={() => setKind('restaurant')}>식당</button>
        <button className={`chip ${kind === 'cafe' ? 'on' : ''}`} onClick={() => setKind('cafe')}>카페</button>
      </div>
      {state.loading ? <Loading /> : state.error ? <ErrorBox error={state.error} /> : (
        <div className="kcard">
          <h3><i className="bi bi-geo-alt" />{place} 주변</h3>
          <div className="mb-3"><MapView height={280} points={state.places.items.map((p) => ({ id: p.id, kind: 'food', name: p.name, lat: p.lat, lon: p.lon, note: p.addr || p.cuisine || '' }))} /></div>
          {state.places.items.length === 0 ? <Empty text="주변 정보를 찾지 못했어요" /> : state.places.items.map((p) => (
            <div className="row-item" key={p.id}>
              <div className="flex-grow-1">
                <div className="fw-bold">{p.name} {p.distKm != null && <span className="chip ms-1">{p.distKm}km</span>}</div>
                <div className="small sub">{p.addr || p.cuisine || p.category || ''}</div>
                <a className="small" href={`https://map.naver.com/p/search/${encodeURIComponent('제주 ' + p.name)}`} target="_blank" rel="noreferrer">네이버 지도 <i className="bi bi-box-arrow-up-right" /></a>
              </div>
              <FavButton kind="restaurant" id={p.id} title={p.name} note={place} />
            </div>
          ))}
          <div className="src">출처 {state.places.source}</div>
          {state.blogs.available && state.blogs.items.length > 0 && (
            <>
              <h3 className="mt-4"><i className="bi bi-chat-quote" />블로그 후기</h3>
              {state.blogs.items.map((b) => <div key={b.url} className="mb-2 small"><a href={b.url} target="_blank" rel="noreferrer" className="fw-bold">{b.title}</a><div className="sub">{b.summary}</div></div>)}
            </>
          )}
          {!state.blogs.available && <div className="src">블로그 후기: 네이버 API 키(NAVER_CLIENT_ID/SECRET)를 넣으면 표시돼요</div>}
        </div>
      )}
    </div>
  )
}

export default function Eat() {
  const [cat, setCat] = useState('snack')
  return (
    <>
      <div className="mb-3">
        <h1 className="headline">제주에서 태어난 <em>브랜드</em>와 <em>한입</em></h1>
        <div className="sub mb-3">로컬 간식·의류·소품, 그리고 근처 맛집까지</div>
        <div className="d-flex gap-2 flex-wrap">
          {CATS.map((c) => <button key={c.key} className={`chip ${cat === c.key ? 'on' : ''}`} onClick={() => setCat(c.key)}><i className={`bi bi-${c.icon}`} />{c.label}</button>)}
        </div>
        {cat === 'near' && <div className="mt-3"><PlacePicker /></div>}
      </div>
      {cat === 'near' ? <Nearby /> : <Brands cat={cat} />}
    </>
  )
}

