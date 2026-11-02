import { route } from '../server/handler.js'
import { getStationAir } from '../server/air.js'
export default route((q) => getStationAir({ station: q.station || '' }))
