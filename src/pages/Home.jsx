import { Link } from 'react-router-dom'
import { Col, Row } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'
import PlacePicker from '../components/PlacePicker'
import HourlyChart from '../components/HourlyChart'
import OutfitPhoto from '../components/OutfitPhoto'
import { HeroArt } from '../components/Logo'
import { ErrorBox, Loading } from '../components/Status'

const MODE_ICON = { outdoor: 'tree', indoor: 'house-heart', food: 'cup-hot' }
const MODE_TEXT = { outdoor: '야외', indoor: '실내', food: '맛집·카페' }
const LV = ['lv0', 'lv1', 'lv2', 'lv3']

function Meter({ label, value, grade }) {
  const lv = Math.max(grade.level, 0)
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between small fw-bold">
        <span>{label}</span><span>{value != null ? `${Math.round(value)}㎍/㎥ · ` : ''}{grade.label}</span>
      </div>
      <div className="meter"><span className={LV[lv]} style={{ width: `${(lv + 1) * 25}%` }} /></div>
    </div>
  )
}

export default function Home() {
  const { today, todayLoading, todayError, place } = useAppStore()
  const loadToday = useAppStore((s) => s.loadToday)

  if (todayError) return <ErrorBox error={todayError} />
  if (!today) return <Loading text="탐험 제주를 불러오는 중..." />
  const { weather: w, air, outfit, plan, mode } = today
  const rainy = w.today.pop >= 50
  const tone = rainy ? 'rain' : w.now.temp >= 22 ? 'warm' : ''

  return (
    <>
      <div className="mb-3">
        <div className="sub greet"><span className="greet-chip">혼저 옵서예</span> 오늘 제주 어디로 가시나요?</div>
        <h1 className="headline">날씨 보고 정하는 <em>탐험 제주</em></h1>
        <PlacePicker />
      </div>

      <div className={`hero mb-3 ${tone}`} style={{ opacity: todayLoading ? 0.6 : 1 }}>
        <HeroArt />
        <i className={`bi bi-${w.now.icon} bigicon`} />
        <div className="d-flex align-items-end gap-3 flex-wrap">
          <div className="temp">{Math.round(w.now.temp)}°</div>
          <div>
            <div className="fs-5 fw-bold">{place} · {w.now.desc}</div>
            <div className="opacity-75">체감 {Math.round(w.now.feel)}° · 최저 {Math.round(w.today.min)}° / 최고 {Math.round(w.today.max)}°</div>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap mt-3">
          <span className="chip"><i className="bi bi-umbrella" />강수 {w.today.pop}%</span>
          <span className="chip"><i className="bi bi-wind" />{w.now.wind}m/s</span>
          <span className="chip"><i className="bi bi-droplet" />습도 {w.now.humidity}%</span>
          <span className="chip"><i className="bi bi-sunrise" />{w.today.sunrise} · {w.today.sunset}</span>
        </div>
      </div>

      <div className="today-line mb-3">
        <div className="small fw-bold sub mb-1"><i className="bi bi-stars me-1" />오늘 이렇게 보내세요</div>
        <div className="today-line-text">
          <b>{place} {w.now.desc} {Math.round(w.now.temp)}°</b>, {outfit.title}에 {outfit.outerText}
          {rainy ? ', 우산도 꼭 챙기세요' : ''}
          {air && air.grade.overall.level >= 2 ? `, 미세먼지 ${air.grade.overall.label}이라 마스크를 쓰세요` : ''}.
          {' '}오늘은 <Link to={`/explore?tab=${mode.mode}`}><b>{mode.mode === 'indoor' ? '실내 탐험' : '야외 탐험'}</b></Link>을 추천해요.
        </div>
      </div>

      <Row className="g-3 mb-3" xs={2} md={4}>
        <Col><Link to="/explore?tab=outdoor" className="tile t2"><i className="bi bi-tree" />야외 탐험</Link></Col>
        <Col><Link to="/explore?tab=indoor" className="tile t3"><i className="bi bi-house-heart" />실내 탐험</Link></Col>
        <Col><Link to="/eat" className="tile t1"><i className="bi bi-cup-hot" />먹거리·쇼핑</Link></Col>
        <Col><Link to="/issue" className="tile t4"><i className="bi bi-newspaper" />제주 이슈</Link></Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col md={7}>
          <div className="kcard">
            <h3><i className="bi bi-graph-up" />오늘의 날씨 변화</h3>
            <div className="fw-bold mb-2">{w.today.trend}</div>
            <HourlyChart hourly={w.hourly} />
            <div className="src">선: 기온 · 막대: 강수확률 · 출처 {w.source}</div>
          </div>
        </Col>
        <Col md={5}>
          <div className="kcard">
            <h3><i className="bi bi-lungs" />미세먼지 · 황사</h3>
            {air ? (
              <>
                <Meter label="미세먼지 PM10" value={air.now.pm10} grade={air.grade.pm10} />
                <Meter label="초미세먼지 PM2.5" value={air.now.pm25} grade={air.grade.pm25} />
                <span className={`chip ${air.yellowDust.level ? 'warn' : ''}`}><i className="bi bi-cloud-haze2" />{air.yellowDust.label}</span>
                <div className="src">출처 {air.source}</div>
              </>
            ) : <div className="sub">대기질 정보를 불러오지 못했어요</div>}
          </div>
        </Col>
      </Row>

      <div className="kcard mb-3">
        <h3><i className="bi bi-handbag" />오늘의 옷차림</h3>
        <p className="mb-3" style={{ lineHeight: 1.7 }}>{outfit.summary}</p>
        <div className="d-flex gap-2 flex-wrap mb-3">
          <span className="chip on">{outfit.title}</span>
          <span className="chip">{outfit.layer}</span>
          <span className={`chip ${outfit.outer ? 'warn' : ''}`}><i className="bi bi-person-arms-up" />{outfit.outerText}</span>
        </div>
        <h4 className="fs-5 fw-bold mt-2 mb-3">추천 옷차림</h4>
        <div className="outfit-grid mb-3">
          {outfit.cards.map((c) => (
            <div key={c.label} className="outfit-card">
              <div className="outfit-img"><OutfitPhoto g={c.g} /></div>
              <div className="outfit-name">{c.label}</div>
              <div className="outfit-sub">{c.sub}</div>
            </div>
          ))}
        </div>
        <ul className="outfit-list">
          {outfit.slots.map((s) => <li key={s.label}><b>{s.label}({s.temp}도 전후):</b> {s.text}</li>)}
        </ul>
        <h4 className="fs-5 fw-bold mt-4 mb-2">주의사항</h4>
        <ul className="outfit-list mb-0">
          {outfit.cautions.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <div className="src">기온·강수: Open-Meteo · 대기질: Open-Meteo Air Quality · 옷 구성은 규칙 기반 추천이에요</div>
      </div>

      <div className="kcard">
        <h3><i className="bi bi-calendar2-check" />오늘 하루 4칸 플랜</h3>
        <div className="sub mb-3">{mode.reason}</div>
        <Row className="g-2" xs={2} md={4}>
          {plan.map((s) => (
            <Col key={s.key}>
              <Link to="/explore" className={`slot ${s.mode} d-block text-decoration-none text-reset h-100`}>
                <div className="t">{s.label} <small className="sub">{s.from}~{s.to}시</small></div>
                <div className="fs-5 fw-bold my-1"><i className={`bi bi-${MODE_ICON[s.mode]} me-1`} />{MODE_TEXT[s.mode]}</div>
                <div className="why">{s.temp}° · {s.reason}</div>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
      <div className="text-center mt-3"><button className="pillbtn ghost" onClick={() => loadToday()}><i className="bi bi-arrow-clockwise me-1" />새로고침</button></div>
    </>
  )
}
