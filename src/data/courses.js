// 코스 완주 도전: 스탬프 장소(spots.js 의 id)를 테마별로 묶는다. 코스의 장소를 모두 인증하면 완주.
export const TRAILS = [
  { id: 'seogwipo-olle', name: '서귀포 올레길 산책', icon: 'signpost-split-fill', color: '#2f7d6f', desc: '올레길이 지나는 서귀포 도심의 바다·폭포·시장', spots: ['oedolgae', 'jeongbang', 'cheonjiyeon', 'olle-market'] },
  { id: 'east-oreum', name: '동부 오름 사총사', icon: 'triangle-fill', color: '#c2682a', desc: '부드러운 능선과 분화구가 이어지는 동쪽 오름', spots: ['yongnuni', 'darangshi-oreum', 'abu', 'geomun'] },
  { id: 'west-sunset', name: '서쪽 노을 코스', icon: 'sunset-fill', color: '#d9534f', desc: '오름 정상과 해변에서 맞는 서부의 일몰', spots: ['geumo', 'hyeopjae', 'gwakji', 'saebyeol'] },
  { id: 'south-coast', name: '남서 해안 절경', icon: 'water', color: '#1f6f9a', desc: '산방산에서 주상절리까지, 화산이 빚은 해안선', spots: ['sanbang', 'yongmeori', 'songak', 'jusangjeolli'] },
  { id: 'forest-walk', name: '숲길 힐링 코스', icon: 'tree-fill', color: '#3a8a4a', desc: '비자나무·삼나무·곶자왈을 걷는 숲 산책', spots: ['bijarim', 'jeolmul', 'gotjawal', 'arboretum'] },
  { id: 'east-end', name: '동쪽 끝 일출 코스', icon: 'brightness-alt-high-fill', color: '#e0a21b', desc: '성산일출봉·섭지코지·우도, 해가 가장 먼저 닿는 곳', spots: ['seongsan', 'seopjikoji', 'udo'] },
]
