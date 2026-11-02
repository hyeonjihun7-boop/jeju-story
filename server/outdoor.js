// 야외 탐험: TourAPI 관광지(12)에서 실내형을 뺀 나머지 + 레포츠(28)를 분류 (사진·좌표 포함)
import { cached } from './http.js'
import { listAll } from './tour.js'

// indoor.js 와 같은 기준으로 실내형을 가려낸다
const IN = /박물관|미술관|갤러리|수족관|아쿠아|전시|뮤지엄|테마파크|테마관|도서관|문학관|기념관|과학|천문|공방|스튜디오|공연|극장|아트|아카이브|미디어|체험관|문화원|월드/
const OUT = /해변|해수욕장|오름|폭포|올레|숲|곶자왈|공원|산책|해안|포구|등대|바다|계곡|분화구|둘레길|한라산|농장|농원|마을|어촌|농촌|목장|사$/

// 분류 (앞에서부터 먼저 맞는 것)
const kindOf = (t) =>
  /묘역|서원|향교|비석|유적|성지|봉수|연대|진성|암자|제단|사\(|사$|사찰|절$|관음|광명|귤림|감사공|당$|굿/.test(t) ? '유적·사찰'
    : /오름|봉$|악$|굼부리|분화구|한라산|산$/.test(t) ? '오름·산'
    : /해변|해수욕장|포구|해안|등대|바다|섬$|갯바위|주상절리|용머리|수산|물$|항$|도$|돌염전|논짓물/.test(t) ? '바다·해안'
    : /폭포|계곡|숲|곶자왈|휴양림|수목원|정원|동굴|연못|못$|수국|유채|메밀|꽃|감귤밭|다희연/.test(t) ? '숲·폭포·정원'
    : /체험|농장|목장|승마|낚시|서핑|카약|레저|스키|골프|ATV|짚|트레킹|낙타|농원|패러|스쿠버|요트|잠수함/.test(t) ? '체험·레포츠'
    : /전망|공원|광장|거리|길|도로|둘레|산책|올레|타운/.test(t) ? '공원·산책·전망'
    : '기타'

export async function getOutdoorAll() {
  const [spots, leports] = await Promise.all([
    cached('outdoor-12', 6 * 3600e3, () => listAll({ contentTypeId: '12' })),
    cached('outdoor-28', 6 * 3600e3, () => listAll({ contentTypeId: '28' })),
  ])
  const outdoorSpots = spots.filter((s) => !(IN.test(s.title) && !OUT.test(s.title)))
  const seen = new Set()
  return [...outdoorSpots, ...leports].filter((p) => !seen.has(p.id) && seen.add(p.id)).map((p) => ({
    id: p.id, title: p.title, name: p.title, sub: p.addr?.replace('제주특별자치도 ', ''), image: p.image, lat: p.lat, lon: p.lon, kind: kindOf(p.title),
  })).sort((a, b) => Number(!!b.image) - Number(!!a.image))
}
