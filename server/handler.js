// api/*.js 공용: 에러를 JSON 으로 돌려주는 래퍼
export const route = (fn) => async (req, res) => {
  try { res.status(200).json(await fn(req.query ?? {}, req)) }
  catch (e) { res.status(500).json({ error: e.message }) }
}
