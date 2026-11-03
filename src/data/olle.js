// 제주올레 코스: 공공데이터포털 「제주특별자치도_올레코스현황」(데이터 기준일 2026-07-31, 제주올레 제공) 의 코스 정보 +
// 시종점 좌표. 공식 데이터에는 좌표가 없어서, 한국관광공사 TourAPI(올레 코스 시작점)와 OpenStreetMap 두 곳이 모두
// 700m 안에서 맞은 지점만 인증 대상으로 쓴다. 한 곳에서만 확인된 지점(용수포구·저지예술정보화마을·간세라운지·가파도)이
// 시종점인 코스는 a/b 를 비워 '안내 코스'로만 보여 준다.
export const OLLE_ASOF = '2026-07-31'
export const OLLE_SITE = 'https://www.jejuolle.org/trail#/'

// 시종점 (r: 인증 반경 m). 반경 700 이상인 곳은 두 출처의 좌표가 500m 이상 벌어진 곳이라 넓게 잡았다.
export const OLLE_POINTS = {
  sihheung: { name: '시흥초등학교', lat: 33.4793, lon: 126.8955, r: 500 },
  gwangchigi: { name: '광치기해변', lat: 33.4527, lon: 126.925, r: 500 },
  onpyeong: { name: '온평포구', lat: 33.405, lon: 126.904, r: 500 },
  pyoseon: { name: '표선해비치해변', lat: 33.3265, lon: 126.84, r: 700 },
  namwon: { name: '남원포구', lat: 33.2784, lon: 126.7188, r: 500 },
  soesokkak: { name: '쇠소깍다리', lat: 33.2524, lon: 126.6234, r: 500 },
  olle: { name: '제주올레 여행자센터', lat: 33.2474, lon: 126.5587, r: 400 },
  wolpyeong: { name: '월평 아왜낭목', lat: 33.2436, lon: 126.4587, r: 500 },
  daepyeong: { name: '대평포구', lat: 33.2368, lon: 126.3618, r: 500 },
  hwasun: { name: '화순금모래해변 일대', lat: 33.2402, lon: 126.3339, r: 500 }, // 9코스 종점 '화순제주올레안내소'도 이 일대
  hamo: { name: '하모체육공원', lat: 33.2186, lon: 126.2525, r: 500 },
  mureung: { name: '제주자연생태문화체험골', lat: 33.274, lon: 126.2368, r: 500 },
  hallim: { name: '한림항 비양도 도항선 선착장', lat: 33.4185, lon: 126.2636, r: 500 },
  gonae: { name: '고내포구', lat: 33.467, lon: 126.3375, r: 500 },
  gwangryeong: { name: '광령1리사무소', lat: 33.4603, lon: 126.4366, r: 700 },
  jocheon: { name: '조천만세동산', lat: 33.5405, lon: 126.641, r: 500 },
  gimnyeong: { name: '김녕서포구', lat: 33.5575, lon: 126.7449, r: 500 },
  haenyeo: { name: '제주해녀박물관', lat: 33.523, lon: 126.8634, r: 500 },
  jongdal: { name: '종달바당', lat: 33.4877, lon: 126.9054, r: 800 },
  worldcup: { name: '월드컵경기장 입구', lat: 33.247, lon: 126.509, r: 500 },
}

// no: 코스 번호 · from/to: 공식 시종점 이름 · a/b: 인증할 시작·종점(OLLE_POINTS 키, 없으면 안내만)
export const OLLE_COURSES = [
  { no: '1', name: '시흥-광치기', km: '15.1', time: '4~5시간', from: '시흥초등학교', to: '광치기해변', a: 'sihheung', b: 'gwangchigi' },
  { no: '2', name: '광치기-온평', km: '14.5', time: '4~5시간', from: '광치기해변', to: '온평포구', a: 'gwangchigi', b: 'onpyeong' },
  { no: '3', name: '온평-표선', km: '13.7~19.9', time: '4~7시간', from: '온평포구', to: '표선해비치해변', a: 'onpyeong', b: 'pyoseon' },
  { no: '4', name: '표선-남원', km: '23.6', time: '6~7시간', from: '표선해비치해변', to: '남원포구', a: 'pyoseon', b: 'namwon' },
  { no: '5', name: '남원-쇠소깍', km: '13.1', time: '4~5시간', from: '남원포구', to: '쇠소깍다리', a: 'namwon', b: 'soesokkak' },
  { no: '6', name: '쇠소깍-서귀포', km: '11', time: '4~5시간', from: '쇠소깍다리', to: '제주올레여행자센터', a: 'soesokkak', b: 'olle' },
  { no: '7', name: '서귀포-월평', km: '17.7', time: '5~6시간', from: '제주올레여행자센터', to: '월평아왜낭목', a: 'olle', b: 'wolpyeong' },
  { no: '7-1', name: '월드컵경기장-여행자센터', km: '15', time: '4~5시간', from: '월드컵경기장입구', to: '제주올레여행자센터', a: 'worldcup', b: 'olle' },
  { no: '8', name: '월평-대평', km: '19.2', time: '5~6시간', from: '월평아왜낭목', to: '대평포구', a: 'wolpyeong', b: 'daepyeong' },
  { no: '9', name: '대평-화순', km: '7.5', time: '3~4시간', from: '대평포구', to: '화순제주올레안내소', a: 'daepyeong', b: 'hwasun' },
  { no: '10', name: '화순-모슬포', km: '17.3', time: '5~6시간', from: '화순금모래해변', to: '모슬포항 하모체육공원', a: 'hwasun', b: 'hamo' },
  { no: '10-1', name: '가파도', km: '4.3', time: '1~2시간', from: '가파도 상동포구', to: '하동포구' },
  { no: '11', name: '모슬포-무릉', km: '17.8', time: '5~6시간', from: '하모체육공원', to: '제주자연생태문화체험골', a: 'hamo', b: 'mureung' },
  { no: '12', name: '무릉-용수', km: '17.1', time: '5~6시간', from: '제주자연생태문화체험골', to: '용수포구' },
  { no: '13', name: '용수-저지', km: '14.8', time: '4~5시간', from: '용수포구', to: '저지예술정보화마을' },
  { no: '14', name: '저지-한림', km: '18.9', time: '6~7시간', from: '저지예술정보화마을', to: '한림항 비양도 도항선 선착장' },
  { no: '14-1', name: '저지-무릉', km: '9.6', time: '3~4시간', from: '저지예술정보화마을', to: '오설록녹차밭' },
  { no: '15', name: '한림-고내', km: '13.5~16.7', time: '4~6시간', from: '한림항 비양도 도항선 선착장', to: '고내포구', a: 'hallim', b: 'gonae' },
  { no: '16', name: '고내-광령', km: '15.7', time: '5~6시간', from: '고내포구', to: '광령1리사무소', a: 'gonae', b: 'gwangryeong' },
  { no: '17', name: '광령-제주시 원도심', km: '17.9', time: '6~7시간', from: '광령1리사무소', to: '간세라운지' },
  { no: '18', name: '제주시 원도심-조천', km: '19', time: '6~7시간', from: '간세라운지', to: '조천만세동산' },
  { no: '19', name: '조천-김녕', km: '19.1', time: '6~8시간', from: '조천만세동산', to: '김녕서포구', a: 'jocheon', b: 'gimnyeong' },
  { no: '20', name: '김녕-하도', km: '17.3', time: '5~6시간', from: '김녕서포구', to: '제주해녀박물관', a: 'gimnyeong', b: 'haenyeo' },
  { no: '21', name: '하도-종달', km: '11.1', time: '3~4시간', from: '제주해녀박물관', to: '종달바당', a: 'haenyeo', b: 'jongdal' },
]
