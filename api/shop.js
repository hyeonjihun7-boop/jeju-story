import { route } from '../server/handler.js'
import { SHOPS } from '../server/data/curated.js'
import { getBrandPhoto } from '../server/photos.js'

// /api/shop?cat=snack — 로컬 브랜드 목록 (+ 네이버 키가 있으면 대표 상품 사진)
export default route(async (q) => {
  const list = q.cat ? SHOPS.filter((s) => s.cat === q.cat) : SHOPS
  const photos = await Promise.all(list.map((s) => getBrandPhoto(s.name).catch(() => null)))
  return {
    hasPhotos: photos.some(Boolean),
    items: list.map((s, i) => ({ ...s, image: photos[i]?.image ?? null, price: photos[i]?.price ?? null, productTitle: photos[i]?.title ?? null, productLink: photos[i]?.link ?? null })),
  }
})
