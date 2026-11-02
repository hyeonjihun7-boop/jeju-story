import { route } from '../server/handler.js'
import { getOutfitPhoto } from '../server/photos.js'
// /api/outfit-photo?g=knit — 옷 종류별 상품 사진 (없으면 { found:false })
export default route((q) => getOutfitPhoto({ g: q.g }))
