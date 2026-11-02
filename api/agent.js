import Anthropic from '@anthropic-ai/sdk'
import { tools, runTool } from '../server/tools.js'

const MODEL = 'claude-sonnet-5-5'

const SYSTEM = `너는 "탐험 제주" 여행 비서 에이전트다. 오늘은 ${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)} (한국시간).
- 날씨·대기질·장소·행사·뉴스는 추측하지 말고 반드시 도구로 확인한 뒤 답한다.
- 일정·옷차림 질문은 먼저 get_today_plan 을 쓴다.
- 비가 오거나 미세먼지가 나쁘면 실내 대안(search_indoor_spots), 맑으면 오름·올레 같은 야외를 추천한다.
- 도구가 키 없음/오류를 돌려주면 그 사실을 솔직히 말하고 가능한 대안을 제시한다.
- 도구 결과에 없는 장소·수치는 지어내지 않는다.
- 한국어로, 6문장 이내, 핵심부터.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 가 설정되지 않았어요 (.env.local / Vercel 환경변수)' })
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { message, history = [] } = req.body ?? {}
  const messages = [...history.slice(-10), { role: 'user', content: message }]
  const steps = [] // 화면에 "에이전트가 호출한 도구" 로 보여줄 기록

  try {
    for (let turn = 0; turn < 6; turn++) {
      const r = await client.messages.create({ model: MODEL, max_tokens: 1200, system: SYSTEM, tools, messages })
      if (r.stop_reason !== 'tool_use') {
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
        return res.status(200).json({ answer, steps })
      }
      messages.push({ role: 'assistant', content: r.content })
      const results = []
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue
        let result
        try { result = await runTool[block.name](block.input ?? {}) }
        catch (e) { result = { error: e.message } }
        const count = Array.isArray(result?.items) ? result.items.length : result?.error ? 0 : 1
        steps.push({ tool: block.name, args: block.input, count, error: result?.error ?? null })
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result).slice(0, 12000) })
      }
      messages.push({ role: 'user', content: results })
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps })
  } catch (e) {
    res.status(e.status ?? 500).json({ error: e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.' : e.message })
  }
}
