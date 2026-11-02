import { useEffect, useState } from 'react'
import { fetchFoodRegions, fetchShops } from '../api/client'
import FavButton from '../components/FavButton'
import Poster from '../components/Poster'
import NaviButton from '../components/NaviButton'
import { Empty, ErrorBox, Loading } from '../components/Status'

const CAT_ICON = { snack: 'cookie', fashion: 'tags', acc: 'gem' }
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
    fetchShops(cat).then((d) => setState(d)).catch((e) => setState({ error: e.message }))
  }, [cat])
  if (state.loading) return <Loading />
  if (state.error) return <ErrorBox error={state.error} />
  return (
    <div className="d-grid gap-3">
      {state.items.map((s) => (
        <div className="kcard brand-card" key={s.id}>
          <a className={`brand-banner cat-${s.cat}`} href={s.productLink ?? s.buyUrl} target="_blank" rel="noreferrer" title={s.productTitle ?? s.name}>
            {s.image ? <img src={s.image} alt={s.productTitle ?? s.name} loading="lazy" referrerPolicy="no-referrer" onError={(ev) => { if (s.thumb && ev.currentTarget.src !== s.thumb) ev.currentTarget.src = s.thumb }} /> : (
              <span className="brand-ph"><i className={`bi bi-${CAT_ICON[s.cat]}`} /><b>{s.name.split(' (')[0]}</b></span>
            )}
            {s.price && <span className="outfit-price">{s.price.toLocaleString()}원~</span>}
          </a>
          <div className="d-flex align-items-start gap-2 mt-3">
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
            <NaviButton name={s.name.split(' (')[0]} lat={null} lon={null} label="카카오 길찾기" />
          </div>
        </div>
      ))}
      <div className="src">큐레이션 목록 · 영업·재고는 방문 전 확인하세요{state.hasPhotos ? ' · 사진: 카카오 이미지 검색' : ' · 브랜드 사진은 카카오 키(KAKAO_REST_KEY)를 넣으면 나와요'}</div>
    </div>
  )
}

const VISIT_JEJU_FOOD = 'https://www.visitjeju.net/kr/detail/list?menuId=DOM_000001719000000000&cate1cd=cate0000000005'

// 지역별 맛집·카페: 지역 칩으로 골라 보고, 지역마다 사진 카드로 나눠 보여준다
function Nearby() {
  const [kind, setKind] = useState('restaurant')
  const [region, setRegion] = useState('전체')
  const [open, setOpen] = useState({})
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let alive = true
    setState({ loading: true })
    fetchFoodRegions(kind).then((d) => alive && setState(d)).catch((e) => alive && setState({ error: e.message }))
    return () => { alive = false }
  }, [kind])
  useEffect(() => { setOpen({}) }, [kind, region])

  const sections = (state.sections ?? []).filter((s) => region === '전체' || s.region === region)
  const label = kind === 'cafe' ? '카페' : '맛집'

  return (
    <div>
      <div className="d-flex gap-2 mb-2">
        <button className={`chip ${kind === 'restaurant' ? 'on' : ''}`} onClick={() => setKind('restaurant')}>식당</button>
        <button className={`chip ${kind === 'cafe' ? 'on' : ''}`} onClick={() => setKind('cafe')}>카페</button>
      </div>
      <div className="d-flex gap-2 flex-wrap mb-3">
        {['전체', ...(state.sections ?? []).map((s) => s.region)].map((r) => (
          <button key={r} className={`chip ${region === r ? 'on' : ''}`} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>
      {state.loading ? <Loading /> : state.error ? <ErrorBox error={state.error} /> : !state.available ? (
        <Empty text="KAKAO_REST_KEY 가 있으면 지역별 맛집·카페가 나와요" />
      ) : sections.length === 0 ? <Empty text="결과를 찾지 못했어요" /> : (
        <div className="d-grid gap-3">
          {sections.map((sec) => (
            <div className="kcard" key={sec.region}>
              <h3><i className="bi bi-geo-alt" />{sec.region} {label} <span className="chip ms-1">{sec.items.length}곳</span></h3>
              <div className="poster-grid">
                {(open[sec.region] || region !== '전체' ? sec.items : sec.items.slice(0, 8)).map((p) => (
                  <Poster key={p.id} image={p.image} thumb={p.thumb} title={p.title} sub={p.sub} icon="cup-hot" href={p.link}
                    navi={p.lat ? { name: p.title, lat: p.lat, lon: p.lon } : undefined}
                    fav={{ kind: 'restaurant', id: p.id, title: p.title, note: sec.region }} />
                ))}
              </div>
              {region === '전체' && sec.items.length > 8 && !open[sec.region] && (
                <div className="text-center mt-3"><button className="pillbtn ghost" onClick={() => setOpen({ ...open, [sec.region]: true })}>{sec.region} {label} {sec.items.length - 8}곳 더 보기</button></div>
              )}
            </div>
          ))}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <a className="pillbtn text-decoration-none" href={VISIT_JEJU_FOOD} target="_blank" rel="noreferrer"><i className="bi bi-box-arrow-up-right me-1" />방문 제주 음식점 전체 보기</a>
            <span className="src m-0">출처 {state.source}{state.total ? ` · 총 ${state.total}곳` : ''}</span>
          </div>
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
        
      </div>
      {cat === 'near' ? <Nearby /> : <Brands cat={cat} />}
    </>
  )
}




