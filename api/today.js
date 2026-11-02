import { route } from '../server/handler.js'
import { getToday } from '../server/today.js'
export default route((q) => getToday({ place: q.place || '제주시' }))
