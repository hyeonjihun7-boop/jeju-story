// 서버 함수 점검: node scripts/smoke.mjs
import { getToday } from '../server/today.js'
import { findOreum, findOlleRoutes, getWikiSummary } from '../server/osm.js'
import { searchNews } from '../server/news.js'
import { SHOPS } from '../server/data/curated.js'

const run = async (name, fn) => {
  try { console.log('OK  ', name, JSON.stringify(await fn()).slice(0, 220)) }
  catch (e) { console.log('FAIL', name, e.message) }
}
await run('today', async () => { const t = await getToday({ place: '제주시' }); return { now: t.weather.now, outfit: t.outfit.headline, air: t.air?.grade.overall, plan: t.plan.map((p) => p.mode), mode: t.mode } })
await run('oreum', async () => (await findOreum({ place: '제주시', limit: 3 })))
await run('olle', async () => { const r = await findOlleRoutes({}); return { n: r.items.length, first: r.items[0] } })
await run('wiki', () => getWikiSummary({ title: '새별오름' }))
await run('news', async () => { const r = await searchNews({ query: '제주' }); return { source: r.source, n: r.items.length, first: r.items[0]?.title } })
console.log('shops', SHOPS.length)
import { getIssueJeju } from '../server/news.js'
await run('issuejeju', async () => { const r = await getIssueJeju({}); return { n: r.items.length, first: r.items[0] } })
