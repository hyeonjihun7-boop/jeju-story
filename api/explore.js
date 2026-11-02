import { route } from '../server/handler.js'
import { getExplore } from '../server/explore.js'
export default route((q) => getExplore({ place: q.place || '제주시', mode: q.mode }))
