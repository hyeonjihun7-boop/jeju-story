// 제주 로컬 브랜드·소품샵·실내 명소 큐레이션 (직접 정리한 목록 — 영업 정보는 방문 전 확인하세요)
const naver = (q) => `https://map.naver.com/p/search/${encodeURIComponent(q)}`
const reserve = (q) => `https://search.naver.com/search.naver?query=${encodeURIComponent(q + ' 예약')}`
const shop = (q) => `https://search.naver.com/search.naver?where=shopping&query=${encodeURIComponent(q)}`

const raw = [
  // ── 먹거리·간식 브랜드 ─────────────────────────
  { id: 'umu', cat: 'snack', name: '우무 (umu)', area: '제주', tags: ['푸딩', '해녀', '디저트'],
    desc: '제주 해녀가 채취한 우뭇가사리로 만든 푸딩 디저트. 방부제를 쓰지 않아 제주에서만 맛볼 수 있는 희소성으로 인기이고, 뷰티(우무솝) 라인까지 확장했어요.' },
  { id: 'gyulmedal', cat: 'snack', name: '귤메달', area: '제주', tags: ['감귤', '주스', '음료'],
    desc: '제주 감귤·시트러스 원물로 만든 주스와 음료. 와인처럼 당도와 산도를 적은 "테이스트 노트" 브랜딩과 디자인이 특징이에요.' },
  { id: 'basalt', cat: 'snack', name: '제주바솔트', area: '제주', tags: ['현무암', '디저트', '선물'],
    desc: '현무암의 거친 질감을 그대로 살린 현무암 샌드·브라우니 같은 이색 디저트. 감도 높은 공간과 패키지로 프리미엄 로컬 브랜드로 불려요.' },
  { id: 'cacaofamily', cat: 'snack', name: '카카오패밀리 (코코하)', area: '구좌읍 세화리', tags: ['초콜릿', '카카오'],
    desc: '구좌읍 세화리에서 시작해 제주 원물과 과테말라 카카오를 합친 초콜릿·카카오 음료를 만드는 로컬 브랜드.' },
  { id: 'hallasweet', cat: 'snack', name: '한라산과자점', area: '제주', tags: ['쿠키', '선물', '말차'],
    desc: '귀여운 한라산 모양 쇼트브레드 쿠키. 우도 땅콩, 제주 말차 같은 로컬 재료를 써서 여행 선물로 자리 잡았어요.' },
  // ── 의류 브랜드 ───────────────────────────────
  { id: 'moj', cat: 'fashion', name: '모제이 (MOJ)', area: '제주', tags: ['내추럴 모던', '천연염색'],
    desc: '2016년 제주에서 시작. 제주 자연에서 얻은 영감과 천연염색(내추럴다잉)의 고급스러운 색감, 피부에 편한 자연 소재가 특징.' },
  { id: 'hallimsujik', cat: 'fashion', name: '한림수직', area: '한림읍 성 이시돌 목장', tags: ['양모 니트', '수공예', '1959'],
    desc: '1959년 성 이시돌 목장에서 탄생한 로컬 의류 브랜드. 목장에서 기른 양모를 재래식 배틀로 짜는 수공예 방식이고, 최근 재생 프로젝트로 재조명받고 있어요.' },
  { id: 'islandproject', cat: 'fashion', name: '아일랜드 프로젝트', area: '제주', tags: ['티셔츠', '로컬 캐주얼'],
    desc: '제주의 지명이나 상징(제주시 승격 연도 등)을 담아 직접 디자인한 티셔츠와 일상복.' },
  // ── 액세서리·소품샵 ──────────────────────────
  { id: 'peoplejeju', cat: 'acc', name: '피플제주 (제주시청점)', area: '제주시청 근처', tags: ['액세서리', '소품', '편집샵'],
    desc: '귀걸이·목걸이·팔찌·헤어핀과 트렌디한 옷, 폰꾸미기 용품을 함께 파는 소품·패션 편집샵. 제주시청에서 도보 이동 가능.' },
  { id: 'arbol', cat: 'acc', name: '아르볼', area: '제주시 관덕로 14 (관덕정 인근)', tags: ['핸드메이드', '천연 소재'],
    desc: '100% 핸드메이드 액세서리 전문점. 물소 뿔·조개·자수정 같은 천연 원재료를 쓰고, 목걸이·팔찌는 즉석에서 길이 조절과 A/S를 해줘요.' },
  { id: 'misomiso', cat: 'acc', name: '미소미소', area: '제주시 관덕로8길 40 (동문시장 근처)', tags: ['키링', '캐릭터 소품'],
    desc: '아기자기한 액세서리와 키덜트 캐릭터 소품, 키링을 만날 수 있는 곳.' },
  { id: 'oksanghoe', cat: 'acc', name: '옥상회', area: '구좌읍 김녕리', tags: ['패션 잡화', '뜨개 가방'],
    desc: '김녕에 있는 아기자기한 패션 잡화점. 의류와 핸드메이드 뜨개가방, 액세서리를 팔아요.' },
  { id: 'aloha', cat: 'acc', name: '알로하제주', area: '서귀포시 중문관광단지 인근', tags: ['리조트룩', '라탄', '서핑'],
    desc: '서핑스쿨을 함께 운영. 여름 원피스·리조트룩과 제주 감성의 핸드메이드 액세서리, 라탄 소품, 패브릭 아이템을 구경할 수 있어요.' },
]

export const SHOPS = raw.map((s) => ({
  ...s,
  mapUrl: naver(s.name.replace(/\s*\(.*\)/, '')),
  reserveUrl: s.cat === 'snack' ? reserve(s.name.replace(/\s*\(.*\)/, '') + ' 제주') : null,
  buyUrl: shop(s.name.replace(/\s*\(.*\)/, '') + ' 제주'),
}))

// 비 오는 날 추천 실내 명소 (좌표 없이 지역명만 — 지도 링크로 연결)
const indoor = [
  { name: '국립제주박물관', area: '제주시 건입동', theme: '역사·문화', desc: '탐라 시대부터 이어진 제주의 역사와 생활문화를 한눈에.' },
  { name: '제주해녀박물관', area: '구좌읍 하도리', theme: '해녀', desc: '해녀의 삶과 물질 도구, 문화를 소개하는 박물관.' },
  { name: '제주4·3평화기념관', area: '제주시 봉개동', theme: '4·3', desc: '제주4·3의 역사를 기억하고 평화를 생각하는 공간.' },
  { name: '제주도립미술관', area: '제주시 연동', theme: '미술', desc: '제주 작가들의 작품을 중심으로 한 도립 미술관.' },
  { name: '본태박물관', area: '서귀포시 안덕면', theme: '건축·공예', desc: '안도 다다오가 설계한 건축과 전통 공예 전시.' },
  { name: '아쿠아플라넷 제주', area: '서귀포시 성산읍', theme: '수족관', desc: '비 오는 날 가족 단위로 가기 좋은 대형 수족관.' },
  { name: '제주민속자연사박물관', area: '제주시 삼성로', theme: '민속·자연사', desc: '제주의 민속과 자연사를 함께 보는 박물관.' },
]
export const INDOOR = indoor.map((p) => ({ ...p, mapUrl: naver(p.name) }))
