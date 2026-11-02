import Anthropic from '@anthropic-ai/sdk'
import { tools, runTool } from '../server/tools.js'

// AI 비서: LLM 이 도구(날씨·오름·맛집·뉴스 등)를 스스로 골라 호출하고 결과로 답한다.
// ANTHROPIC_API_KEY 가 있으면 Claude, 없고 GEMINI_API_KEY 가 있으면 Gemini 를 사용한다.
const CLAUDE_MODEL = 'claude-sonnet-5-5'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash' // 시험 결과 가장 빠르고 안정적 (flash-latest 는 혼잡 시 503)
// 한도(429)·혼잡(503)·시간 초과일 때 차례로 넘어갈 대체 모델 (모델마다 무료 한도가 따로 있어 효과가 있다)
const GEMINI_FALLBACKS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview']
const GEMINI_MODELS = [...new Set([GEMINI_MODEL, ...GEMINI_FALLBACKS])]
const RETRYABLE = new Set([404, 408, 429, 500, 502, 503, 504])

const SYSTEM = `너는 "탐험 제주" 여행 비서 에이전트다. 오늘은 ${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)} (한국시간).
- 날씨·대기질·장소·행사·뉴스는 추측하지 말고 반드시 도구로 확인한 뒤 답한다.
- 일정·옷차림 질문은 먼저 get_today_plan 을 쓴다.
- 비가 오거나 미세먼지가 나쁘면 실내 대안(search_indoor_spots), 맑으면 오름·올레 같은 야외를 추천한다.
- 도구가 키 없음/오류를 돌려주면 그 사실을 솔직히 말하고 가능한 대안을 제시한다.
- 도구 결과에 없는 장소·수치는 지어내지 않는다.
- 일반 질문은 한국어로 6문장 이내, 핵심부터 답한다.
- 사용자가 일정·코스를 짜 달라고 하면(예: 당일치기, 1박 2일, 내일 일정) get_today_plan·실내/야외 추천·맛집·행사 도구로 확인한 뒤, 반드시 아래 형식으로 답한다. 이 경우 6문장 제한은 적용하지 않는다.
  ## 1일차 (그날 날씨 한 줄)
  - 09:00 | 장소 이름 | 한 줄 설명 (이동 방법·비 대비 등)
  하루 4~6칸, 점심(맛집)과 카페를 포함하고 비 오는 날은 실내 중심으로 짠다. 날짜별 제목 줄은 '## N일차'로 시작한다.
  마지막에 준비물·유의사항을 일반 문장 1~2줄로 덧붙인다. 도구로 확인된 날씨는 오늘·내일뿐이니, 그 이후 날짜는 '예보를 다시 확인하세요'라고 말한다.`

const MAX_TURNS = 6
const CACHE_MS = 10 * 60e3
const answerCache = new Map()

// 도구 실행 + 화면에 보여줄 기록(steps) 만들기
async function execTool(name, input, steps) {
  let result
  try { result = await runTool[name](input ?? {}) }
  catch (e) { result = { error: e.message } }
  const count = Array.isArray(result?.items) ? result.items.length : result?.error ? 0 : 1
  steps.push({ tool: name, args: input, count, error: result?.error ?? null })
  return result
}

// ── Claude ───────────────────────────────────────────────
async function runClaude(message, history, steps) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const messages = [...history.slice(-10), { role: 'user', content: message }]
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const r = await client.messages.create({ model: CLAUDE_MODEL, max_tokens: 2400, system: SYSTEM, tools, messages })
    if (r.stop_reason !== 'tool_use') return r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    messages.push({ role: 'assistant', content: r.content })
    const results = []
    for (const block of r.content) {
      if (block.type !== 'tool_use') continue
      const result = await execTool(block.name, block.input, steps)
      results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result).slice(0, 12000) })
    }
    messages.push({ role: 'user', content: results })
  }
  return null
}

// ── Gemini (REST, SDK 없이) ─────────────────────────────────
// Claude 형식의 도구 설명서(input_schema)를 Gemini functionDeclarations 로 바꾼다
const geminiTools = [{
  functionDeclarations: tools.map((t) => {
    const hasProps = t.input_schema?.properties && Object.keys(t.input_schema.properties).length > 0
    const decl = { name: t.name, description: t.description }
    if (hasProps) decl.parameters = t.input_schema // 빈 properties 는 Gemini 가 거부하므로 생략
    return decl
  }),
}]

async function geminiCall(body, ctx) {
  let last
  for (const model of ctx.models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: AbortSignal.timeout(40000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify(body),
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok) { ctx.model = model; ctx.models = [model, ...ctx.models.filter((m) => m !== model)]; return data } // 성공한 모델을 다음 호출에도 먼저 쓴다
      const err = new Error(data?.error?.message || `Gemini HTTP ${r.status}`)
      err.status = r.status
      last = err
      if (!RETRYABLE.has(r.status)) throw err // 키 오류 등은 다른 모델로 바꿔도 소용없다
    } catch (e) {
      if (e.status && !RETRYABLE.has(e.status)) throw e
      last = e.status ? e : Object.assign(new Error('Gemini 응답 시간 초과'), { status: 504 })
    }
  }
  throw last
}

async function runGemini(message, history, steps, ctx) {
  const contents = [
    ...history.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] })),
    { role: 'user', parts: [{ text: message }] },
  ]
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const data = await geminiCall({
      systemInstruction: { parts: [{ text: SYSTEM }] }, contents, tools: geminiTools,
      generationConfig: { maxOutputTokens: 3000, temperature: 0.4 },
    }, ctx)
    const cand = data.candidates?.[0]
    const parts = cand?.content?.parts ?? []
    const calls = parts.filter((p) => p.functionCall)
    if (!calls.length) {
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('\n').trim()
      if (text) return text
      return cand?.finishReason === 'SAFETY' ? '안전 정책 때문에 답하지 못했어요. 질문을 바꿔 주세요.' : '답변을 만들지 못했어요. 다시 물어봐 주세요.'
    }
    contents.push({ role: 'model', parts }) // 모델의 함수 호출 요청을 그대로 기록
    const responses = []
    for (const p of calls) {
      const result = await execTool(p.functionCall.name, p.functionCall.args, steps)
      const text = JSON.stringify(result)
      responses.push({ functionResponse: { name: p.functionCall.name, response: { result: text.length > 12000 ? text.slice(0, 12000) : result } } })
    }
    contents.push({ role: 'user', parts: responses })
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const useClaude = Boolean(process.env.ANTHROPIC_API_KEY)
  const useGemini = !useClaude && Boolean(process.env.GEMINI_API_KEY)
  if (!useClaude && !useGemini) {
    return res.status(500).json({ error: 'AI 키가 설정되지 않았어요 (ANTHROPIC_API_KEY 또는 GEMINI_API_KEY — .env.local / Vercel 환경변수)' })
  }
  const { message, history = [] } = req.body ?? {}
  if (!message || !String(message).trim()) return res.status(400).json({ error: '질문을 입력해 주세요' })
  const steps = [] // 화면에 "에이전트가 호출한 도구" 로 보여줄 기록
  const key = !history.length ? String(message).trim().toLowerCase() : null // 첫 질문만 잠시 저장 (같은 질문 반복 시 한도 절약)
  const hit = key && answerCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return res.status(200).json({ ...hit.body, cached: true })
  const ctx = { models: [...GEMINI_MODELS], model: null }

  let provider = useClaude ? 'claude' : 'gemini'
  try {
    let answer
    try {
      answer = useClaude ? await runClaude(message, history, steps) : await runGemini(message, history, steps, ctx)
    } catch (e) {
      // Claude 가 실패하면(크레딧 부족·한도·장애 등) Gemini 키가 있을 때 자동으로 넘어간다
      if (!(useClaude && process.env.GEMINI_API_KEY)) throw e
      console.warn('Claude 실패 → Gemini 로 대체:', e.status, String(e.message).slice(0, 120))
      steps.length = 0
      provider = 'gemini'
      answer = await runGemini(message, history, steps, ctx)
    }
    const body = { answer: answer ?? '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps, provider, model: ctx.model }
    if (key && answer) answerCache.set(key, { at: Date.now(), body })
    res.status(200).json(body)
  } catch (e) {
    const status = e.status ?? 500
    const msg = status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.'
      : status === 400 && useGemini && /API key/i.test(e.message) ? 'Gemini API 키가 올바르지 않아요 (GEMINI_API_KEY 확인)'
      : e.message
    res.status(status).json({ error: msg })
  }
}
