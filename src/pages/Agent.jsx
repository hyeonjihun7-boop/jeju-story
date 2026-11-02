import { useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'

const SUGGEST = [
  '오늘 서귀포에서 뭐 입고 어디 가면 좋을까?',
  '비 오면 갈 만한 실내 명소 알려줘',
  '애월 근처 오름이랑 설명 알려줘',
  '지금 제주 뉴스 중에 여행에 영향 있는 거 있어?',
  '선물하기 좋은 제주 로컬 간식 추천해줘',
]

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
        <h1 className="headline">물어보면 <em>도구를 골라</em> 답해요</h1>
        <div className="sub">AI 비서가 날씨·대기질·오름·올레·행사·뉴스 API를 직접 호출합니다</div>
      </div>
      <div className="chat mb-3" ref={box}>
        {messages.length === 0 && (
          <div>
            <div className="sub mb-2">이렇게 물어보세요</div>
            <div className="d-flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} className="chip" onClick={() => submit(s)}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i}>
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
            <div className={`msg ${m.role}`}>{m.text}</div>
          </div>
        ))}
        {chatLoading && <div className="sub small"><Spinner size="sm" className="me-2" />도구를 고르고 호출하는 중…</div>}
      </div>
      <form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <input className="form-control rounded-pill px-3" value={input} onChange={(e) => setInput(e.target.value)} placeholder="오늘 제주에서 궁금한 것을 물어보세요" />
        <button className="pillbtn" disabled={chatLoading}><i className="bi bi-send" /></button>
        {messages.length > 0 && <button type="button" className="pillbtn ghost" onClick={clearChat} aria-label="대화 지우기"><i className="bi bi-trash" /></button>}
      </form>
    </>
  )
}
