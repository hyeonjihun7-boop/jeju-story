import { useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { fetchElevation, fetchExplore, fetchFestivals, fetchWiki } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import PlacePicker from '../components/PlacePicker'
import FavButton from '../components/FavButton'
import { Empty, ErrorBox, Loading } from '../components/Status'

const TABS = [
  { key: 'auto', label: '오늘 날씨 추천', icon: 'magic' },
  { key: 'outdoor', label: '야외', icon: 'tree' },
  { key: 'indoor', label: '실내', icon: 'house-heart' },
  { key: 'festival', label: '축제·행사', icon: 'balloon-heart' },
]

// 오름 카드: 눌러서 고도(Open-Meteo)·설명(위키백과)을 불러온다
function OreumItem({ o }) {
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  async function open() {
    if (info) return setInfo(null)
    setBusy(true)
    const [wiki, elev] = await Promise.allSettled([fetchWiki(o.name), o.ele ? null : fetchElevation(o.lat, o.lon)])
    setInfo({
      wiki: wiki.value?.found ? wiki.value : null,
      ele: o.ele ?? elev.value?.elevation ?? null,
    })
    setBusy(false)
  }
  return (
    <div className="row-item">
      <div className="flex-grow-1">
        <div className="fw-bold">{o.name} <span className="chip ms-1">{o.distKm}km</span>{o.ele && <span className="chip ms-1">{o.ele}m</span>}</div>
        <button className="btn btn-link p-0 small" onClick={open}>{busy ? '불러오는 중…' : info ? '접기' : '고도·설명 보기'}</button>
        {info && (
          <div className="small mt-1">
            {info.ele != null && <div className="fw-bold">해발 약 {info.ele}m</div>}
            {info.wiki ? <>{info.wiki.extract} <a href={info.wiki.url} target="_blank" rel="noreferrer">위키백과</a></> : <span className="sub">위키백과에 설명이 없어요</span>}
          </div>
        )}
      </div>
      <FavButton kind="oreum" id={o.id} title={o.name} note={o.ele ? `${o.ele}m` : ''} />
    </div>
  )
}

function Item({ sec, it }) {
  if (sec.key === 'oreum') return <OreumItem o={it} />
  if (sec.key === 'olle') {
    return (
      <div className="row-item">
        <div className="flex-grow-1">
          <div className="fw-bold">{it.name}</div>
          <div className="small sub">{it.from} → {it.to}</div>
          <a className="small" href={it.url} target="_blank" rel="noreferrer">공식 코스 안내 <i className="bi bi-box-arrow-up-right" /></a>
        </div>
        <FavButton kind="olle" id={it.id} title={it.name} />
      </div>
    )
  }
  if (sec.key === 'indoor') {
    return (
      <div className="row-item">
        <div className="flex-grow-1">
          <div className="fw-bold">{it.name} <span className="chip ms-1">{it.theme}</span></div>
          <div className="small sub">{it.area}</div>
          <div className="small">{it.desc}</div>
          <a className="small" href={it.mapUrl} target="_blank" rel="noreferrer">지도에서 보기 <i className="bi bi-box-arrow-up-right" /></a>
        </div>
        <FavButton kind="indoor" id={it.name} title={it.name} note={it.area} />
      </div>
    )
  }
  return (
    <div className="row-item">
      {it.image && <img className="thumb" src={it.image} alt="" loading="lazy" />}
      <div className="flex-grow-1"><div className="fw-bold">{it.title}</div><div className="small sub">{it.addr}</div></div>
      <FavButton kind="tour" id={it.id} title={it.title} note={it.addr} />
    </div>
  )
}

function Festivals() {
  const [state, setState] = useState({ loading: true })
  useEffect(() => { fetchFestivals().then((d) => setState({ items: d.items })).catch((e) => setState({ error: e.message })) }, [])
  if (state.loading) return <Loading />
  if (state.error) return <ErrorBox error={state.error + ' — .env.local 의 DATA_GO_KR_KEY(Decoding 키)와 TourAPI 활용신청을 확인하세요'} />
  if (!state.items.length) return <Empty text="진행·예정 중인 행사가 없어요" />
  return (
    <div className="kcard">
      <h3><i className="bi bi-balloon-heart" />제주 축제·행사 (오늘 이후)</h3>
      {state.items.map((f) => (
        <div className="row-item" key={f.id}>
          {f.image && <img className="thumb" src={f.image} alt="" loading="lazy" />}
          <div className="flex-grow-1">
            <div className="fw-bold">{f.title}</div>
            <div className="small sub">{f.start} ~ {f.end} · {f.addr}</div>
          </div>
          <FavButton kind="festival" id={f.id} title={f.title} note={`${f.start}~${f.end}`} />
        </div>
      ))}
      <div className="src">출처 한국관광공사 TourAPI</div>
    </div>
  )
}

export default function Explore() {
  const place = useAppStore((s) => s.place)
  const [tab, setTab] = useState('auto')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'festival') return
    let alive = true
    setLoading(true); setError('')
    fetchExplore(place, tab === 'auto' ? '' : tab)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [place, tab])

  return (
    <>
      <div className="mb-3">
        <h1 className="headline">비 오면 <em>실내</em>, 맑으면 <em>오름·올레</em></h1>
        <div className="sub mb-2">오늘 날씨에 맞춰 갈 곳을 골라 드려요</div>
        <PlacePicker />
        <div className="d-flex gap-2 flex-wrap mt-3">
          {TABS.map((t) => (
            <button key={t.key} className={`chip ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`bi bi-${t.icon}`} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'festival' ? <Festivals /> : loading ? <Loading /> : error ? <ErrorBox error={error} /> : data && (
        <>
          <div className="kcard mb-3" style={{ background: data.mode === 'indoor' ? '#e3eef5' : '#dcefe6' }}>
            <i className={`bi bi-${data.mode === 'indoor' ? 'umbrella' : 'sun'} me-2`} />
            <b>{data.mode === 'indoor' ? '실내 추천' : '야외 추천'}</b> · {data.reason}
            {!data.auto && <span className="sub"> (직접 선택)</span>}
          </div>
          {data.notes.map((n) => <div key={n} className="small text-danger mb-2">{n}</div>)}
          <Row className="g-3">
            {data.sections.map((sec) => (
              <Col md={12} lg={sec.items.length > 6 ? 12 : 6} key={sec.key}>
                <div className="kcard">
                  <h3><i className="bi bi-geo-alt" />{sec.title}</h3>
                  {sec.items.length === 0 ? <Empty /> : sec.items.map((it) => <Item key={it.id ?? it.name} sec={sec} it={it} />)}
                  {sec.key === 'oreum' && <div className="small mt-2"><a href="http://www.ormstory.kr/" target="_blank" rel="noreferrer">오름나들이 — 오름 이야기 더 보기 <i className="bi bi-box-arrow-up-right" /></a></div>}
                  {sec.key === 'olle' && <div className="small mt-2"><a href="https://www.jejuolle.org/trail#/" target="_blank" rel="noreferrer">제주올레 공식 사이트에서 전체 코스 보기 <i className="bi bi-box-arrow-up-right" /></a></div>}
                  <div className="src">출처 {sec.source}</div>
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}
    </>
  )
}
