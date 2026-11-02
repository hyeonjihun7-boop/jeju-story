import { route } from '../server/handler.js'
import { getWikiSummary, getElevation, getRouteLength } from '../server/osm.js'
// /api/spot?action=wiki&title=.. | elevation&lat=&lon= | length&id=
export default route(async (q) => {
  if (q.action === 'wiki') return getWikiSummary({ title: q.title })
  if (q.action === 'elevation') return getElevation({ lat: q.lat, lon: q.lon })
  if (q.action === 'length') return getRouteLength({ id: q.id })
  throw new Error('action 은 wiki | elevation | length')
})
