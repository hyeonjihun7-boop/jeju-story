import { useEffect, useState } from 'react'
import { fetchIssueJeju, fetchNews } from '../api/client'
import FavButton from '../components/FavButton'
import { Empty, ErrorBox, Loading } from '../components/Status'

const TOPICS = ['제주', '제주 4·3', '제주 관광', '제주 날씨', '제주 축제']

// 제주 이슈 칸: 이슈제주(지역 언론 RSS) + 키워드별 뉴스(네이버 키가 있으면 네이버, 없으면 Google 뉴스 RSS)
export default function Issue() {
  const [src, setSrc] = useState('issue')
  const [topic, setTopic] = useState('제주')
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let alive = true
    setState({ loading: true })
    const p = src === 'issue' ? fetchIssueJeju() : fetchNews(topic)
    p.then((d) => alive && setState(d)).catch((e) => alive && setState({ error: e.message }))
    return () => { alive = false }
  }, [src, topic])

  return (
    <>
      <div className="mb-3">
        <h1 className="headline">오늘 제주에서 <em>무슨 일</em>이?</h1>
        <div className="sub mb-3">지역 언론과 뉴스 검색을 한 번에</div>
        <div className="d-flex gap-2 flex-wrap">
          <button className={`chip ${src === 'issue' ? 'on' : ''}`} onClick={() => setSrc('issue')}><i className="bi bi-broadcast" />이슈제주</button>
          <button className={`chip ${src === 'search' ? 'on' : ''}`} onClick={() => setSrc('search')}><i className="bi bi-search" />주제별 뉴스</button>
        </div>
        {src === 'search' && <div className="d-flex gap-2 flex-wrap mt-2">{TOPICS.map((t) => <button key={t} className={`chip ${t === topic ? 'on' : ''}`} onClick={() => setTopic(t)}>{t}</button>)}</div>}
      </div>

      {state.loading ? <Loading /> : state.error ? <ErrorBox error={state.error} /> : state.items.length === 0 ? <Empty /> : (
        <div className="kcard">
          {state.items.map((n) => (
            <div className="row-item" key={n.url}>
              {n.image && <img className="thumb" src={n.image} alt="" loading="lazy" />}
              <div className="flex-grow-1">
                <a href={n.url} target="_blank" rel="noreferrer" className="fw-bold text-reset text-decoration-none">{n.title}</a>
                {n.summary && <div className="small sub mt-1">{n.summary}</div>}
                <div className="small sub mt-1">{n.press ? n.press + ' · ' : ''}{n.date}</div>
              </div>
              <FavButton kind="news" id={n.url} title={n.title} note={n.date} />
            </div>
          ))}
          <div className="src">출처 {state.source}{state.home && <> · <a href={state.home} target="_blank" rel="noreferrer">이슈제주 바로가기</a></>} — 기사 저작권은 각 언론사에 있어요</div>
        </div>
      )}
    </>
  )
}
