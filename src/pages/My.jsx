import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isSupabaseReady, supabase } from '../lib/supabase'
import FavButton from '../components/FavButton'
import { Empty, Loading } from '../components/Status'

const KIND = { oreum: '오름', olle: '올레', indoor: '실내', tour: '관광지', festival: '행사', brand: '브랜드', restaurant: '맛집', news: '뉴스' }

export default function My() {
  const { nickname, setNickname, favorites, favLoading, loadFavorites } = useAppStore()
  const [logs, setLogs] = useState([])
  const [draft, setDraft] = useState(nickname)

  useEffect(() => {
    if (!supabase) return
    supabase.from('chat_logs').select('*').eq('nickname', nickname || '익명').order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setLogs(data ?? []))
  }, [nickname])

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
      {favLoading ? <Loading /> : favorites.length === 0 ? <Empty text="아직 담은 곳이 없어요" hint="카드의 북마크 버튼을 눌러보세요" /> : (
        <div className="kcard mb-3">
          {favorites.map((f) => (
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
