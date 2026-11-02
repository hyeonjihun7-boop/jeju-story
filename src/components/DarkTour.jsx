import { useEffect, useState } from 'react'
import { fetchDark } from '../api/client'
import MapView from './MapView'
import FavButton from './FavButton'
import NaviButton from './NaviButton'
import { Empty, ErrorBox, Loading } from './Status'

// 다크 투어리즘: 비극의 현장을 기억하는 여행 — 차분한 톤으로 장소·프로그램·방문 예절을 안내
export default function DarkTour() {
  const [state, setState] = useState({ loading: true })
  const [region, setRegion] = useState('전체')
  const [theme, setTheme] = useState('전체')
  useEffect(() => { fetchDark().then(setState).catch((e) => setState({ error: e.message })) }, [])
  if (state.loading) return <Loading />
  if (state.error) return <ErrorBox error={state.error} />

  const list = state.items.filter((p) => (region === '전체' || p.region === region) && (theme === '전체' || p.theme === theme))
  const points = list.map((p) => ({ id: p.id, kind: 'dark', name: p.name, lat: p.lat, lon: p.lon, note: `${p.theme} · ${p.region}`, addr: p.addr, img: p.image, desc: p.desc }))

  return (
    <>
      <div className="kcard dark-intro mb-3">
        <h3><i className="bi bi-flower2" />기억하는 여행</h3>
        <p className="mb-2">전쟁·학살·재난 같은 비극적인 역사의 현장을 찾아 희생자를 기리고 교훈을 얻는 여행이에요. 아름다운 풍경 뒤에 남은 아픈 역사를 차분히 마주해 보세요.</p>
        <ul className="dark-manners mb-0">
          <li>유적지는 추모의 공간이에요. 조용히 둘러보고, 큰 소리와 장난스러운 사진은 삼가 주세요.</li>
          <li>위령비·묘역·유해 발굴지에는 올라가거나 만지지 마세요.</li>
          <li>보존 때문에 출입이 제한되거나 운영 시간이 있는 곳이 있어요. 방문 전에 확인하세요.</li>
        </ul>
      </div>

      <div className="kcard mb-3 p-2">
        <MapView points={points} />
        <div className="small sub px-2 pt-2">지도 핀은 위치가 확인된 곳만 표시돼요. 핀을 누르면 사진·설명과 길찾기 링크가 나와요.</div>
      </div>

      <div className="kcard mb-3">
        <h3><i className="bi bi-geo-alt" />다크 투어리즘 명소 <span className="chip ms-1">{list.length}곳</span></h3>
        <div className="d-flex gap-2 flex-wrap mb-3">
          {['전체', '동부권', '서부권'].map((r) => (
            <button key={r} className={`chip ${region === r ? 'on' : ''}`} onClick={() => setRegion(r)}>{r}</button>
          ))}
          <span className="mx-1" />
          {['전체', '4·3', '일제강점기'].map((t) => (
            <button key={t} className={`chip ${theme === t ? 'on' : ''}`} onClick={() => setTheme(t)}>{t}</button>
          ))}
        </div>
        {list.length === 0 ? <Empty /> : (
          <div className="dark-grid">
            {list.map((p) => (
              <div className="dark-card" key={p.id}>
                <div className="dark-img">
                  {p.image
                    ? <img src={p.image} alt={p.name} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { if (p.thumb && e.currentTarget.src !== p.thumb) e.currentTarget.src = p.thumb }} />
                    : <div className="poster-ph"><i className="bi bi-flower2" /><span>{p.name}</span></div>}
                  {p.refImage && <span className="ref-badge">참고 이미지</span>}
                  <span className="poster-fav"><FavButton kind="tour" id={`dark-${p.id}`} title={p.name} note={p.region} /></span>
                </div>
                <div className="dark-body">
                  <div className="fw-bold">{p.name}</div>
                  <div className="d-flex gap-1 flex-wrap my-1">
                    <span className="chip">{p.region}</span>
                    <span className="chip">{p.theme}</span>
                    {p.source === 'added' && <span className="chip warn" title="직접 정리한 장소예요. 방문 전 운영 여부를 확인하세요">추가 정리</span>}
                  </div>
                  <div className="small">{p.desc}</div>
                  {p.addr && <div className="small sub mt-1">{p.addr}</div>}
                  <NaviButton name={p.officialName ?? p.name} lat={p.lat} lon={p.lon} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="src">출처 {state.source}. “추가 정리” 표시는 직접 정리한 곳이라 방문 전 운영·출입 여부를 확인해 주세요.</div>
      </div>

      <div className="kcard">
        <h3><i className="bi bi-signpost-split" />참여 프로그램</h3>
        <div className="d-grid gap-3">
          {state.programs.map((g) => (
            <div key={g.title} className="dark-program">
              <div className="fw-bold">{g.title}</div>
              <div className="small my-1">{g.desc}</div>
              <div className="d-flex gap-2 flex-wrap">
                {g.links.map((l) => (
                  <a key={l.url} className="pillbtn ghost text-decoration-none" href={l.url} target="_blank" rel="noreferrer">
                    <i className="bi bi-box-arrow-up-right me-1" />{l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
