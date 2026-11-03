// 탐험하기 스탬프 장소: 직접 정리한 목록. 좌표는 TourAPI·OpenStreetMap 두 곳으로 대조한 값이다
// (김녕은 OSM 기준, 우도 서빈백사는 대조하지 못한 대략값이라 반경을 넓게 잡았다).
// 인증 반경(r, m) 안에 들어오면 스탬프가 찍힌다.
// 역사(다크 투어리즘) 장소는 서버(TourAPI)에서 좌표를 받아 화면에서 합친다.
export const KINDS = {
  oreum: { label: '오름', icon: 'triangle-fill', color: '#2c6b55' },
  sea: { label: '바다', icon: 'water', color: '#3a8fb7' },
  history: { label: '역사', icon: 'flower2', color: '#5b4a6b' },
  food: { label: '맛집', icon: 'cup-hot-fill', color: '#d6402f' },
}

export const SPOTS = [
  // ── 오름·산 (ele = 해발 m) ──
  { id: 'seongsan', kind: 'oreum', name: '성산일출봉', lat: 33.4581, lon: 126.9415, r: 700, ele: 182, desc: '바다에서 솟은 분화구. 해돋이 명소예요.' },
  { id: 'saebyeol', kind: 'oreum', name: '새별오름', lat: 33.3663, lon: 126.3577, r: 700, ele: 519, desc: '들불축제가 열리는 서부의 대표 오름.' },
  { id: 'sanbang', kind: 'oreum', name: '산방산', lat: 33.2416, lon: 126.3133, r: 700, ele: 395, desc: '평지에 우뚝 솟은 종 모양 바위산.' },
  { id: 'yongnuni', kind: 'oreum', name: '용눈이오름', lat: 33.4599, lon: 126.8325, r: 800, ele: 248, desc: '부드러운 능선이 이어지는 동부 오름.' },
  { id: 'darangshi-oreum', kind: 'oreum', name: '다랑쉬오름', lat: 33.4777, lon: 126.8215, r: 800, ele: 382, desc: '깊게 파인 원형 분화구가 인상적인 오름.' },
  { id: 'abu', kind: 'oreum', name: '아부오름', lat: 33.4476, lon: 126.7797, r: 800, ele: 301, desc: '분화구 안 소나무 숲이 포근한 오름.' },
  { id: 'geumo', kind: 'oreum', name: '금오름', lat: 33.3546, lon: 126.3058, r: 800, ele: 427, desc: '정상의 호수(분화구)와 노을이 유명해요.' },
  { id: 'geomun', kind: 'oreum', name: '거문오름', lat: 33.4548, lon: 126.7182, r: 800, ele: 456, desc: '유네스코 세계자연유산 용암동굴계의 기원.' },
  { id: 'songak', kind: 'oreum', name: '송악산', lat: 33.1991, lon: 126.2898, r: 800, ele: 104, desc: '바다와 마라도가 한눈에 보이는 해안 오름.' },
  { id: 'hallasan', kind: 'oreum', name: '한라산 백록담', lat: 33.3623, lon: 126.5334, r: 1500, ele: 1947, desc: '남한에서 가장 높은 산. 정상 도전!' },
  // ── 바다·해안 ──
  { id: 'hyeopjae', kind: 'sea', name: '협재해변', lat: 33.3942, lon: 126.2408, r: 600, desc: '에메랄드빛 바다와 비양도 풍경.' },
  { id: 'hamdeok', kind: 'sea', name: '함덕해수욕장', lat: 33.5439, lon: 126.6684, r: 600, desc: '맑은 바다색으로 사랑받는 동쪽 해변.' },
  { id: 'gimnyeong', kind: 'sea', name: '김녕해수욕장', lat: 33.5578, lon: 126.7590, r: 600, desc: '고운 모래와 투명한 바다.' },
  { id: 'woljeong', kind: 'sea', name: '월정리해변', lat: 33.5551, lon: 126.7982, r: 600, desc: '카페 거리와 함께 걷는 해변.' },
  { id: 'yongmeori', kind: 'sea', name: '용머리해안', lat: 33.2333, lon: 126.3131, r: 600, desc: '용이 머리를 내민 모양의 해안 절벽.' },
  { id: 'seopjikoji', kind: 'sea', name: '섭지코지', lat: 33.4236, lon: 126.9297, r: 700, desc: '등대와 초원이 이어지는 해안 산책길.' },
  { id: 'soesokkak', kind: 'sea', name: '쇠소깍', lat: 33.253, lon: 126.6227, r: 600, desc: '바다와 계곡이 만나는 에메랄드빛 웅덩이.' },
  { id: 'jusangjeolli', kind: 'sea', name: '주상절리대', lat: 33.2377, lon: 126.426, r: 600, desc: '육각 기둥 모양 절벽이 이어지는 해안.' },
  { id: 'ihotewoo', kind: 'sea', name: '이호테우해변', lat: 33.4974, lon: 126.4531, r: 600, desc: '말 모양 등대가 있는 도심 가까운 해변.' },
  { id: 'gwakji', kind: 'sea', name: '곽지해수욕장', lat: 33.4485, lon: 126.3031, r: 600, desc: '일몰이 아름다운 애월의 해변.' },
  { id: 'udo', kind: 'sea', name: '우도 서빈백사', lat: 33.5040, lon: 126.9550, r: 1000, desc: '홍조단괴로 이뤄진 하얀 모래 해변.' },
  // ── 맛집·시장 ──
  { id: 'dongmun', kind: 'food', name: '동문시장', lat: 33.5122, lon: 126.5276, r: 350, desc: '제주시의 대표 재래시장. 먹거리 가득.' },
  { id: 'olle-market', kind: 'food', name: '서귀포매일올레시장', lat: 33.2502, lon: 126.5632, r: 350, desc: '서귀포의 아케이드 시장.' },
]

// 서버가 준 다크 투어리즘 장소 → 스탬프 장소 (좌표 없는 곳은 뺀다)
export function historySpots(items = []) {
  return items.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)).map((p) => ({
    id: `dark-${p.id}`, kind: 'history', name: p.name, lat: p.lat, lon: p.lon, r: 700, desc: p.desc, addr: p.addr, img: p.image,
  }))
}
