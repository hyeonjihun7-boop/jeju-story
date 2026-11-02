import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Col, Row } from 'react-bootstrap'
import { fetchElevation, fetchExplore, fetchFestivals, fetchWiki } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import PlacePicker from '../components/PlacePicker'
import FavButton from '../components/FavButton'
import MapView from '../components/MapView'
import { Empty, ErrorBox, Loading } from '../components/Status'

const TABS = [
  { key: 'indoor', label: '실내 탐험', icon: 'house-heart' },
  { key: 'outdoor', label: '야외 탐험', icon: 'tree' },
  { key: 'auto', label: '오늘 날씨 추천', icon: 'magic' },
  { key: 'festival', label: '축제·행사', icon: 'balloon-heart' },
]
const HEAD = {
  auto: ['오늘의', '탐험', '오늘 날씨에 맞춰 갈 곳을 골라 드려요'],
  indoor: ['실내', '탐험', '박물관·미술관 같은 실내 명소를 모았어요'],
  outdoor: ['야외', '탐험', '가까운 오름과 올레길을 모았어요'],
  festival: ['제주', '축제·행사', '오늘 이후 열리는 행사를 확인하세요'],
}

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
  useEffect(() => { fetchFestivals().then((d) => setState(d)).catch((e) => setState({ error: e.message })) }, [])
  if (state.loading) return <Loading />
  if (state.error) return <ErrorBox error={state.error + ' — .env.local 의 DATA_GO_KR_KEY(Decoding 키)와 TourAPI 활용신청을 확인하세요'} />
  if (state.fallback) {
    return (
      <div className="kcard">
        <h3><i className="bi bi-balloon-heart" />제주 축제 소식</h3>
        <div className="small sub mb-2">공식 행사 목록(날짜·장소)은 .env.local 에 DATA_GO_KR_KEY 를 넣으면 나와요. 지금은 최신 뉴스예요.</div>
        {state.items.map((n) => (
          <div className="row-item" key={n.url}>
            <div className="flex-grow-1"><a href={n.url} target="_blank" rel="noreferrer" className="fw-bold text-reset text-decoration-none">{n.title}</a><div className="small sub">{n.press ? n.press + ' · ' : ''}{n.date}</div></div>
            <FavButton kind="news" id={n.url} title={n.title} note={n.date} />
          </div>
        ))}
        <div className="src">출처 {state.source}</div>
      </div>
    )
  }
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
  const [params, setParams] = useSearchParams()
  const tab = HEAD[params.get('tab')] ? params.get('tab') : 'auto'
  const setTab = (t) => setParams(t === 'auto' ? {} : { tab: t }, { replace: true })
  const [data, setData] = useState(null)
  // 모든 섹션의 좌표 있는 항목을 지도 핀으로
  const points = useMemo(() => (data?.sections ?? []).flatMap((sec) => sec.items.map((it) => ({
    id: it.id ?? it.name, kind: sec.key, name: it.name ?? it.title, lat: it.lat, lon: it.lon,
    note: sec.key === 'oreum' ? (it.ele ? `${it.ele}m` : '오름') : sec.key === 'olle' ? `${it.from} → ${it.to}` : sec.key === 'indoor' ? `${it.area} (대략 위치)` : it.addr,
  }))), [data])
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
        <h1 className="headline">{HEAD[tab][0]} <em>{HEAD[tab][1]}</em></h1>
        <div className="sub mb-2">{HEAD[tab][2]}</div>
        <PlacePicker />
        <div className="modebar mt-3">
          {TABS.map((t) => (
            <button key={t.key} className={`modebtn ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
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
          <div className="kcard mb-3 p-2">
            <MapView points={points} center={data.center} />
            <div className="d-flex gap-3 flex-wrap small sub px-2 pt-2">
              <span><i className="bi bi-circle-fill" style={{ color: '#2c6b55' }} /> 오름</span>
              <span><i className="bi bi-circle-fill" style={{ color: '#3a8fb7' }} /> 올레</span>
              <span><i className="bi bi-circle-fill" style={{ color: '#7a5fb0' }} /> 실내 명소</span>
              <span><i className="bi bi-circle-fill" style={{ color: '#ff9f2e' }} /> 관광지</span>
              <span className="ms-auto">핀을 누르면 이름과 네이버 지도 링크가 나와요</span>
            </div>
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


