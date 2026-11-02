// 다크 투어리즘: 전쟁·학살·재난 같은 비극의 현장을 찾아 희생자를 기리고 교훈을 얻는 여행
// 장소 목록 = 사용자 제공 5곳 + 추가 정리 7곳. 위치·사진은 한국관광공사 TourAPI 에서 찾아 붙이고,
// 찾지 못한 곳은 좌표 없이 지도 검색으로 연결한다 (잘못된 핀을 찍지 않기 위해).
import { cached } from './http.js'
import { searchSpots } from './tour.js'
import { getImageFor } from './photos.js'

export const PLACES = [
  // ── 제공받은 목록 ──
  { id: 'peace-park', name: '제주4·3평화공원·기념관', region: '동부권', theme: '4·3', source: 'user', find: ['4·3평화'],
    desc: '제주 4·3 사건의 희생자를 기리고 아픈 역사를 배우는 대표적인 필수 코스입니다.' },
  { id: 'neobunsungi', name: '북촌 너븐숭이 4·3 위령성지', region: '동부권', theme: '4·3', source: 'user', find: ['너븐숭이'],
    desc: '4·3 당시 큰 비극이 일어난 마을로, 관련 역사관과 위령비가 있습니다.' },
  { id: 'seotal', name: '섯알오름 양민학살터', region: '서부권', theme: '4·3', source: 'user', find: ['섯알오름'],
    desc: '일제강점기 군사 시설과 섯알오름 학살의 아픔이 서린 장소입니다.' },
  { id: 'altteure', name: '알뜨르 비행장·일제 동굴진지', region: '서부권', theme: '일제강점기', source: 'user', find: ['알뜨르', '격납고'],
    desc: '일제강점기 말기 일본군이 구축한 비행장과 강제노동의 흔적, 동굴진지를 볼 수 있는 곳입니다.' },
  { id: 'gunsan', name: '군산오름', region: '서부권', theme: '일제강점기', source: 'user', find: ['군산오름'],
    desc: '아름다운 경치 이면에 일본군의 군사 진지와 고사포 진지 흔적이 남아 있는 장소입니다.' },
  // ── 추가 정리 (TourAPI 에서 확인된 곳) ──
  { id: 'bukchon-gil', name: '북촌마을 4·3길', region: '동부권', theme: '4·3', source: 'added', find: ['북촌마을 4·3길', '4·3길'],
    desc: '북촌 마을에 남은 4·3의 흔적을 따라 걸으며 그날을 기억하는 길입니다.' },
  { id: 'sinchon', name: '신촌 4·3 성터', region: '동부권', theme: '4·3', source: 'added', find: ['신촌 4·3', '4·3 성터'],
    desc: '4·3 당시 마을 주변에 쌓았던 성터가 남아 있는 곳입니다.' },
  { id: 'jujeong', name: '주정공장 수용소 4·3역사관', region: '동부권', theme: '4·3', source: 'added', find: ['주정공장'],
    desc: '4·3 당시 수용소로 쓰였던 주정공장 터에 마련된 역사관입니다.' },
  { id: 'songak', name: '송악산 진지동굴', region: '서부권', theme: '일제강점기', source: 'added', find: ['송악산 진지동굴', '진지동굴'],
    desc: '일제강점기 말기 일본군이 해안에 만든 진지 동굴의 흔적을 볼 수 있습니다.' },
  // ── 추가 정리 (TourAPI 에 없어 지도 검색으로 연결) ──
  { id: 'darangshi', name: '다랑쉬굴', region: '동부권', theme: '4·3', source: 'added', find: [],
    desc: '4·3 당시 피신했던 주민들이 희생된 동굴로 알려진 유적지입니다. 현장은 보존을 위해 출입이 제한될 수 있어요.' },
  { id: 'nakseon', name: '낙선동 4·3성', region: '동부권', theme: '4·3', source: 'added', find: [],
    // 글자가 없는 성터 사진으로 직접 골라 고정 (검색 1순위는 글자가 들어간 이미지였음)
    imageOverride: "https://postfiles.pstatic.net/MjAyNDA4MjdfMTk2/MDAxNzI0NzM3NjEzMzU5.IUK4qpG25fgw2e1xTFXH7C01tFLfSPQ8tlfk1QTfsN0g.tjI--ia3MbS1AxGP6Vhu1vwMpOhVPOIbHW7oEr5YhNIg.JPEG/%EB%82%99%EC%84%A0%EB%8F%994.3%EC%84%B1A62A8637.jpg?type=w966", imageFallback: "https://postfiles.pstatic.net/MjAyNDA4MjdfMTUy/MDAxNzI0NzM3NTYwMjI5.8sc_bwHswdJyQ7h_zFyLUlab_I1i4A_QGbSNFWwX9-Yg.G-hk5bePnmzJqvP6wA0Gz9Lze1JOfhB6YjVWsdcQYlgg.JPEG/%EB%82%99%EC%84%A0%EB%8F%994.3%EC%84%B1A62A8609.jpg?type=w966",
    desc: '4·3 당시 주민들이 쌓아 올린 성터를 복원한 유적지입니다.' },
  { id: 'baekjo', name: '백조일손지묘', region: '서부권', theme: '4·3', source: 'added', find: [],
    desc: '섯알오름 학살 희생자들을 한데 모신 묘역입니다.' },
]

export const PROGRAMS = [
  {
    title: '모바일 스탬프 투어',
    desc: '제주특별자치도와 제주관광협회 등이 4·3 유적지와 지역 문화 공간(독립서점 등)을 연계해 운영하는 참여형 프로그램입니다. 지정 유적지를 포함해 장소를 방문하고 인증하면 기념품(양우산 등)을 받을 수 있어요.',
    links: [
      { label: '제주도 공식 블로그', url: 'https://m.blog.naver.com/jejudo_official/224242515714' },
      { label: '제주관광협회 공지', url: 'https://www.visitjeju.or.kr/comm/notice.htm?qtype=title&query=%EB%8B%A4%ED%81%AC&act=view&seq=58534' },
    ],
  },
  {
    title: '(사)제주다크투어',
    desc: '비영리 단체로, 해설과 함께하는 역사 기행 프로그램에 참여할 수 있습니다.',
    links: [{ label: '제주다크투어 홈페이지', url: 'https://www.jejudarktours.org/ko/' }],
  },
]

const pick = (rows, keys) => rows.find((r) => keys.some((k) => r.title.includes(k)))

export async function getDarkTourism() {
  let enriched = PLACES.map((p) => ({ ...p }))
  if (process.env.DATA_GO_KR_KEY) {
    enriched = await Promise.all(PLACES.map(async (p) => {
      const out = { ...p }
      for (const key of p.find) {
        const rows = await cached('dark:' + key, 6 * 3600e3, () => searchSpots({ keyword: key, contentTypeId: '' })).catch(() => [])
        const hit = pick(rows, p.find)
        if (hit) { Object.assign(out, { lat: hit.lat, lon: hit.lon, image: hit.image, addr: hit.addr?.replace('제주특별자치도 ', ''), officialName: hit.title }); break }
      }
      if (p.imageOverride) Object.assign(out, { image: p.imageOverride, thumb: p.imageFallback, refImage: true })
      // TourAPI 에 사진이 없으면 카카오 이미지 검색으로 참고 사진을 찾는다
      if (!out.image) {
        const img = await getImageFor(p.name + ' 제주').catch(() => null)
        if (img) Object.assign(out, { image: img.image, thumb: img.thumb, refImage: true })
      }
      return out
    }))
  }
  return { items: enriched, programs: PROGRAMS, source: '직접 정리한 목록 + 한국관광공사 TourAPI(위치·사진)' }
}
