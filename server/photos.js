// 추천 옷차림 실제 사진: 네이버 쇼핑 검색 API의 상품 사진·가격·구매 링크 (NAVER_CLIENT_ID/SECRET 필요)
// ※ Wikimedia Commons 검색도 시험했지만 관련 없는 사진이 섞여 쓰지 않습니다. 키가 없으면 화면은 일러스트 카드로 대체됩니다.
import { getJson, cached } from './http.js'

// 옷 종류 → 쇼핑 검색어
const TERMS = {
  tee: ['반팔 티셔츠', 'T-shirt'], shirt: ['셔츠', 'dress shirt'], longsleeve: ['긴팔 티셔츠', 'long-sleeved shirt'],
  knit: ['니트 스웨터', 'sweater clothing'], cardigan: ['가디건', 'cardigan clothing'], jacket: ['자켓', 'jacket clothing'],
  coat: ['트렌치코트', 'trench coat'], puffer: ['패딩 점퍼', 'down jacket'], pants: ['청바지', 'jeans'], shorts: ['반바지', 'shorts clothing'],
  scarf: ['목도리', 'scarf'], sandal: ['샌들', 'sandals footwear'], boot: ['레인부츠', 'rain boots'], umbrella: ['우산', 'umbrella'],
  hat: ['챙모자', 'sun hat'], sun: ['선크림', 'sunscreen'], mask: ['KF94 마스크', 'face mask'],
}

const strip = (s = '') => String(s).replace(/<[^>]+>/g, '').replaceAll('&amp;', '&')

async function fromNaver(term) {
  const d = await getJson(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(term)}&display=5&sort=sim`, {
    headers: { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET },
  })
  const it = d.items?.find((i) => i.image)
  if (!it) return null
  return { image: it.image, title: strip(it.title), link: it.link, price: Number(it.lprice) || null, source: '네이버 쇼핑' }
}

export async function getOutfitPhoto({ g }) {
  const term = TERMS[g]
  if (!term) return { found: false }
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return { found: false, reason: 'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 가 있으면 상품 사진을 보여줘요' }
  }
  return cached('photo:' + g, 24 * 3600e3, async () => {
    const r = await fromNaver(term[0]).catch(() => null)
    return r ? { found: true, ...r } : { found: false }
  })
}

// 브랜드 대표 상품 사진: "<브랜드명> 제주" 로 쇼핑 검색 (키 없으면 null)
export async function getBrandPhoto(name) {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) return null
  const q = name.split(' (')[0] + ' 제주'
  return cached('brand:' + q, 24 * 3600e3, () => fromNaver(q).catch(() => null))
}
