import Poster from './Poster'

// 오늘의 추천: 날짜별로 바뀌는 장소 6곳 (같은 날에는 누구에게나 같은 추천)
export default function DailyPicks({ sec }) {
  const outdoor = sec.mode === 'outdoor'
  const [, m, d] = sec.date.split('-')
  return (
    <div className="kcard daily-card">
      <h3>
        <i className="bi bi-stars" />오늘의 {outdoor ? '야외' : '실내'} 추천
        <span className="chip ms-2">{Number(m)}월 {Number(d)}일</span>
      </h3>
      <div className="small sub mb-3">날마다 새로 골라 드려요. 자정이 지나면 다른 곳이 나와요.</div>
      <div className="poster-grid">
        {sec.items.map((p) => (
          <Poster key={p.id} image={p.image} title={p.title} sub={`${p.kind} · ${p.sub ?? ''}`} icon={outdoor ? 'tree' : 'bank'}
            navi={{ name: p.title, lat: p.lat, lon: p.lon }}
            fav={{ kind: outdoor ? 'tour' : 'indoor', id: p.id, title: p.title, note: p.sub }} />
        ))}
      </div>
      <div className="src">{sec.source}</div>
    </div>
  )
}
