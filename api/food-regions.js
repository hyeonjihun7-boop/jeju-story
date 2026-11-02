import { route } from '../server/handler.js'
import { getRegionFood } from '../server/regionFood.js'
// /api/food-regions?kind=restaurant|cafe — 지역별 맛집·카페 (사진 포함)
export default route((q) => getRegionFood({ kind: q.kind === 'cafe' ? 'cafe' : 'restaurant' }))
