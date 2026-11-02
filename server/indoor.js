// 실내 탐험: TourAPI 문화시설(14) 전체 + 관광지(12) 중 실내형(박물관·미술관·수족관·체험관 등)만 골라서 분류
import { cached } from './http.js'
import { listAll } from './tour.js'
import { kindOf } from './culture.js'

const IN = /박물관|미술관|갤러리|수족관|아쿠아|전시|뮤지엄|테마파크|테마관|도서관|문학관|기념관|과학|천문|공방|스튜디오|공연|극장|아트|아카이브|미디어|체험관|문화원|월드/
const OUT = /해변|해수욕장|오름|폭포|올레|숲|곶자왈|공원|산책|해안|포구|등대|바다|계곡|분화구|둘레길|한라산|농장|농원|마을|어촌|농촌|목장|사$/

const indoorKind = (t) => /수족관|아쿠아|워터월드|테마파크|체험관|과학|천문|뮤지엄/.test(t) && !/박물관|미술관/.test(t) ? '수족관·체험·테마' : kindOf(t)

export async function getIndoorAll() {
  const [culture, spots] = await Promise.all([
    cached('indoor-14', 6 * 3600e3, () => listAll({ contentTypeId: '14' })),
    cached('indoor-12', 6 * 3600e3, () => listAll({ contentTypeId: '12' })),
  ])
  const picked = [...culture, ...spots.filter((s) => IN.test(s.title) && !OUT.test(s.title))]
  const seen = new Set()
  return picked.filter((p) => !seen.has(p.id) && seen.add(p.id)).map((p) => ({
    id: p.id, title: p.title, name: p.title, sub: p.addr?.replace('제주특별자치도 ', ''), image: p.image, lat: p.lat, lon: p.lon, kind: indoorKind(p.title),
  })).sort((a, b) => Number(!!b.image) - Number(!!a.image))
}
