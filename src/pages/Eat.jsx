import { useEffect, useState } from 'react'
import { fetchFood, fetchShops } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import PlacePicker from '../components/PlacePicker'
import Poster from '../components/Poster'
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

const VISIT_JEJU_FOOD = 'https://www.visitjeju.net/kr/detail/list?menuId=DOM_000001719000000000&cate1cd=cate0000000005'

function Nearby() {
  const place = useAppStore((s) => s.place)
  const [kind, setKind] = useState('restaurant')
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ loading: true })
  useEffect(() => { setPage(1) }, [place, kind])
  useEffect(() => {
    let alive = true
    setState({ loading: true })
    fetchFood(place, kind, page).then((d) => alive && setState(d)).catch((e) => alive && setState({ error: e.message }))
    return () => { alive = false }
  }, [place, kind, page])

  // 사진이 있는 TourAPI 목록이 있으면 그것을, 없으면 주변 식당(OSM/카카오)을 같은 카드 모양으로
  const cards = state.tour?.items?.length
    ? state.tour.items.map((p) => ({ id: p.id, title: p.title, image: p.image, sub: p.addr }))
    : (state.places?.items ?? []).map((p) => ({ id: p.id, title: p.name, image: null, sub: p.addr || (p.distKm != null ? p.distKm + 'km' : p.cuisine || '') }))

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        <button className={`chip ${kind === 'restaurant' ? 'on' : ''}`} onClick={() => setKind('restaurant')}>식당</button>
        <button className={`chip ${kind === 'cafe' ? 'on' : ''}`} onClick={() => setKind('cafe')}>카페</button>
      </div>
      {state.loading ? <Loading /> : state.error ? <ErrorBox error={state.error} /> : (
        <div className="kcard">
          <h3><i className="bi bi-geo-alt" />{place} 주변</h3>
          <div className="mb-3"><MapView height={260} points={(state.places?.items ?? []).map((p) => ({ id: p.id, kind: 'food', name: p.name, lat: p.lat, lon: p.lon, note: p.addr || p.cuisine || '' }))} /></div>
          {state.tour?.error && <div className="small text-danger mb-2">TourAPI 오류: {state.tour.error}</div>}
          {!state.tour && <div className="small sub mb-3">음식점 사진은 .env.local 에 DATA_GO_KR_KEY 를 넣으면 나와요. 지금은 주변 식당 목록이에요.</div>}
          {cards.length === 0 ? <Empty text="주변 정보를 찾지 못했어요" /> : (
            <div className="poster-grid">
              {cards.map((p) => (
                <Poster key={p.id} image={p.image} title={p.title} sub={p.sub} icon="cup-hot" href={`https://map.naver.com/p/search/${encodeURIComponent('제주 ' + p.title)}`}
                  fav={{ kind: 'restaurant', id: p.id, title: p.title, note: place }} />
              ))}
            </div>
          )}
          {state.tour && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              <button className="pillbtn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}><i className="bi bi-chevron-left" /> 이전</button>
              <b>{page}</b>
              <button className="pillbtn ghost" disabled={!state.tour.items?.length || state.tour.items.length < 12} onClick={() => setPage(page + 1)}>다음 <i className="bi bi-chevron-right" /></button>
            </div>
          )}
          <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
            <a className="pillbtn text-decoration-none" href={VISIT_JEJU_FOOD} target="_blank" rel="noreferrer"><i className="bi bi-box-arrow-up-right me-1" />방문 제주 음식점 전체 보기</a>
            <span className="src m-0">출처 {state.tour?.items?.length ? '한국관광공사 TourAPI' : state.places?.source}</span>
          </div>
          {state.blogs?.available && state.blogs.items.length > 0 && (
            <>
              <h3 className="mt-4"><i className="bi bi-chat-quote" />블로그 후기</h3>
              {state.blogs.items.map((b) => <div key={b.url} className="mb-2 small"><a href={b.url} target="_blank" rel="noreferrer" className="fw-bold">{b.title}</a><div className="sub">{b.summary}</div></div>)}
            </>
          )}
          {state.blogs && !state.blogs.available && <div className="src">블로그 후기: 네이버 API 키(NAVER_CLIENT_ID/SECRET)를 넣으면 표시돼요</div>}
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

