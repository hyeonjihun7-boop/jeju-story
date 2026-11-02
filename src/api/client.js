// 화면 → /api 서버 함수. 공공데이터·비밀 키는 브라우저에서 직접 쓰지 않습니다 (키 노출 + CORS).
async function readJson(r) {
  let data
  try { data = await r.json() } catch { throw new Error(`서버 응답이 JSON이 아님 (${r.status})`) }
  if (!r.ok) throw new Error(data.error || r.statusText)
  return data
}
const get = async (path) => readJson(await fetch(path))
const post = async (path, body) => readJson(await fetch(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}))
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')).toString()

export const ping = () => get('/api/hello')
export const fetchToday = (place) => get('/api/today?' + qs({ place }))
export const fetchExplore = (place, mode) => get('/api/explore?' + qs({ place, mode }))
export const fetchWiki = (title) => get('/api/spot?' + qs({ action: 'wiki', title }))
export const fetchElevation = (lat, lon) => get('/api/spot?' + qs({ action: 'elevation', lat, lon }))
export const fetchFestivals = (year, month) => get('/api/festivals?' + qs({ year, month }))
export const fetchShops = (cat) => get('/api/shop?' + qs({ cat }))
export const fetchFood = (place, kind, page) => get('/api/food?' + qs({ place, kind, page }))
export const fetchIssueJeju = () => get('/api/news?src=issue')
export const fetchNews = (q) => get('/api/news?' + qs({ q }))
export const fetchStation = (station) => get('/api/station?' + qs({ station }))
export const askAgent = (message, history) => post('/api/agent', { message, history })
export const fetchOutfitPhoto = (g) => get('/api/outfit-photo?' + qs({ g }))
