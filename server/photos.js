// 추천 옷차림·브랜드 실제 사진: 카카오(다음) 이미지 검색 API (KAKAO_REST_KEY)
// 키가 없으면 화면이 옷 일러스트 / 카테고리 배너로 대체됩니다.
// ※ Wikimedia Commons 검색도 시험했지만 관련 없는 사진이 섞여 쓰지 않습니다.
import { getJson, cached } from './http.js'

// 옷 종류 → 검색어
const TERMS = {
  tee: '반팔 티셔츠', shirt: '셔츠', longsleeve: '긴팔 티셔츠', knit: '니트 스웨터', cardigan: '가디건', jacket: '자켓',
  coat: '트렌치코트', puffer: '패딩 점퍼', pants: '청바지', shorts: '반바지', scarf: '목도리', sandal: '샌들',
  boot: '레인부츠', umbrella: '우산', hat: '챙모자', sun: '선크림', mask: 'KF94 마스크',
}

const hasKakao = () => Boolean(process.env.KAKAO_REST_KEY)

// 카카오 이미지 검색: 썸네일 + 출처 페이지 링크 (가격 정보는 없음)
async function fromKakao(term) {
  const d = await getJson(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(term)}&size=10`, {
    headers: { Authorization: 'KakaoAK ' + process.env.KAKAO_REST_KEY },
  })
  const it = d.documents?.find((i) => i.thumbnail_url && i.width >= 300 && i.height >= 300)
  if (!it) return null
  return { image: it.thumbnail_url, title: it.display_sitename || term, link: it.doc_url, source: '카카오 이미지 검색' }
}

export async function getOutfitPhoto({ g }) {
  const term = TERMS[g]
  if (!term) return { found: false }
  if (!hasKakao()) return { found: false, reason: 'KAKAO_REST_KEY 가 있으면 옷 사진을 보여줘요' }
  return cached('photo:' + g, 24 * 3600e3, async () => {
    const r = await fromKakao(term + ' 코디').catch(() => null)
    return r ? { found: true, ...r } : { found: false }
  })
}

// 브랜드 대표 사진: "<브랜드명> 제주" 검색 (키 없으면 null)
export async function getBrandPhoto(name) {
  if (!hasKakao()) return null
  const q = name.split(' (')[0] + ' 제주'
  return cached('brand:' + q, 24 * 3600e3, () => fromKakao(q).catch(() => null))
}
