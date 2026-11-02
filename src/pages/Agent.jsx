import { useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'
import Itinerary, { parseItinerary } from '../components/Itinerary'

const SUGGEST = [
  { icon: 'calendar2-week', q: '내일 당일치기 제주 일정 짜줘' },
  { icon: 'moon-stars', q: '1박 2일 제주 일정 짜줘' },
  { icon: 'umbrella', q: '비 오는 날 가기 좋은 실내 코스로 하루 일정 짜줘' },
  { icon: 'handbag', q: '오늘 서귀포에서 뭐 입고 어디 가면 좋을까?' },
  { icon: 'flower2', q: '서부권 다크 투어리즘 코스 알려줘' },
]

// 질문 문장에서 일정 제목을 만든다
const tripTitle = (q) => (q || '내 제주 일정').replace(/\s+/g, ' ').slice(0, 30)

function Message({ m, question }) {
  const saveTrip = useAppStore((s) => s.saveTrip)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const plan = m.role === 'assistant' ? parseItinerary(m.text) : null

  async function save() {
    setBusy(true)
    const ok = await saveTrip({ title: tripTitle(question), question, content: m.text, tools: (m.steps ?? []).map((s) => s.tool) })
    setBusy(false)
    if (ok) setSaved(true)
  }

  return (
    <div>
      {m.steps?.length > 0 && (
        <div className="mb-1">
          <div className="small sub mb-1"><i className="bi bi-tools me-1" />에이전트가 호출한 도구</div>
          {m.steps.map((s, k) => (
            <span key={k} className={`toolchip ${s.error ? 'err' : ''}`} title={JSON.stringify(s.args)}>
              <i className={`bi bi-${s.error ? 'x-circle' : 'check-circle'}`} />{s.tool}{s.args && Object.keys(s.args).length ? `(${Object.values(s.args).join(', ')})` : ''} · {s.count}건
            </span>
          ))}
        </div>
      )}
      {plan ? (
        <>
          <Itinerary plan={plan} />
          <div className="trip-actions">
            {saved
              ? <span className="trip-saved"><i className="bi bi-check2-circle me-1" />내 일정에 저장했어요 (북마크 → 내 여행 일정)</span>
              : <button className="pillbtn" disabled={busy} onClick={save}><i className="bi bi-bookmark-plus me-1" />{busy ? '저장 중…' : '내 일정에 저장'}</button>}
          </div>
        </>
      ) : <div className={`msg ${m.role}`}>{m.text}</div>}
    </div>
  )
}

export default function Agent() {
  const { messages, chatLoading, sendMessage, clearChat } = useAppStore()
  const [input, setInput] = useState('')
  const box = useRef(null)
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }) }, [messages, chatLoading])

  function submit(text) {
    const t = (text ?? input).trim()
    if (!t || chatLoading) return
    sendMessage(t)
    setInput('')
  }

  return (
    <>
      <div className="mb-3">
        <h1 className="headline">물어보면 <em>일정까지</em> 짜 드려요</h1>
        <div className="sub">AI 비서가 날씨·대기질·오름·올레·행사·맛집 API를 직접 호출해 시간표를 만들고, 마음에 들면 저장할 수 있어요</div>
      </div>
      <div className="chat mb-3" ref={box}>
        {messages.length === 0 && (
          <div>
            <div className="sub mb-2">이렇게 물어보세요</div>
            <div className="d-flex flex-wrap gap-2">
              {SUGGEST.map((s) => <button key={s.q} className="chip" onClick={() => submit(s.q)}><i className={`bi bi-${s.icon}`} />{s.q}</button>)}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <Message key={i} m={m} question={[...messages].slice(0, i).reverse().find((x) => x.role === 'user')?.text} />
        ))}
        {chatLoading && <div className="sub small"><Spinner size="sm" className="me-2" />도구를 고르고 호출하는 중… (일정은 조금 더 걸려요)</div>}
      </div>
      <form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <input className="form-control rounded-pill px-3" value={input} onChange={(e) => setInput(e.target.value)} placeholder="예) 내일 1박 2일 일정 짜줘" />
        <button className="pillbtn" disabled={chatLoading}><i className="bi bi-send" /></button>
        {messages.length > 0 && <button type="button" className="pillbtn ghost" onClick={clearChat} aria-label="대화 지우기"><i className="bi bi-trash" /></button>}
      </form>
    </>
  )
}
