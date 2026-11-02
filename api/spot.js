import { route } from '../server/handler.js'
import { getWikiSummary, getElevation, getRouteLength } from '../server/osm.js'
import { getDarkTourism } from '../server/dark.js'
import { resolvePlaces } from '../server/places.js'
import { getDriveTimes } from '../server/drive.js'
// /api/spot?action=wiki&title=.. | elevation&lat=&lon= | length&id= | drive&pts=lat,lon;lat,lon
export default route(async (q) => {
  if (q.action === 'drive') return getDriveTimes({ pts: q.pts })
  if (q.action === 'dark') return getDarkTourism()
  if (q.action === 'places') return resolvePlaces(String(q.names || '').split('|'))
  if (q.action === 'wiki') return getWikiSummary({ title: q.title })
  if (q.action === 'elevation') return getElevation({ lat: q.lat, lon: q.lon })
  if (q.action === 'length') return getRouteLength({ id: q.id })
  throw new Error('action 은 wiki | elevation | length')
})
