// 도트 해녀가 말풍선으로 들려주는 오늘의 날씨·미션 안내. jeju: 제주 말씨, std: 표준말 풀이
const GREET = {
  clear: { jeju: '날씨 좋수다! 혼저 옵서예~', std: '오늘은 맑아요. 야외 탐험하기 좋은 날이에요!' },
  partly: { jeju: '구름이 몽글몽글 햄수다.', std: '구름이 조금 있어요. 다니기 선선한 날이에요.' },
  overcast: { jeju: '하늘이 꾸물꾸물 햄수다.', std: '흐린 날이에요. 우산을 챙기면 좋아요.' },
  fog: { jeju: '안개가 자욱허우다. 조심헙서예.', std: '안개가 껴요. 운전과 산행은 조심하세요.' },
  drizzle: { jeju: '이슬비가 소록소록 오우다.', std: '이슬비가 내려요. 우산을 챙기세요.' },
  rain: { jeju: '비 오난 안에서 놀게 마씸.', std: '비가 와요. 오늘은 실내 탐험을 추천해요.' },
  storm: { jeju: '하늘이 와글와글! 오늘은 쉽서예.', std: '천둥·번개가 쳐요. 오늘은 안전하게 쉬어요.' },
  snow: { jeju: '눈이 풀풀 내리마씸.', std: '눈이 내려요. 길이 미끄러우니 조심하세요.' },
}
const BY_PHASE = {
  night: { jeju: '폭삭 속았수다! 오늘도 수고했수다.', std: '오늘 하루 고생 많았어요. 탐험 기록을 남겨 볼까요?' },
  dawn: { jeju: '새벽 바당이 곱수다게.', std: '새벽 바다가 예뻐요. 일출 보러 가 볼까요?' },
}
const SUNSET = { jeju: '노을이 곱수다. 바당 구경 갑서예~', std: '노을이 예뻐요. 바다 구경 가 보세요.' }

export function haenyeoLines(mood, mission) {
  const out = []
  const wet = ['drizzle', 'rain', 'storm', 'snow'].includes(mood.kind)
  if (mood.phase === 'night') out.push(BY_PHASE.night)
  else if (mood.phase === 'dawn' && !wet) out.push(BY_PHASE.dawn)
  else if ((mood.phase === 'golden' || mood.phase === 'dusk') && (mood.kind === 'clear' || mood.kind === 'partly')) out.push(SUNSET)
  else out.push(GREET[mood.kind] ?? GREET.clear)
  if (mood.wind >= 7) out.push({ jeju: '보름이 쎄게 붐수다. 모자 조심헙서!', std: '바람이 세요. 모자와 우산을 조심하세요.' })
  if (mission?.target) {
    out.push(mission.done
      ? { jeju: '오늘 미션 다 했구나, 잘햄수다!', std: '오늘의 탐험 미션을 모두 마쳤어요.' }
      : { jeju: `오늘은 ${mission.target.name}에 가 봅서예!`, std: `오늘의 미션: ${mission.target.name}에서 스탬프 찍기` })
  }
  out.push({ jeju: '본 건 일지에 한 줄 남깁서예~', std: '탐험 일지에 오늘 본 것을 남겨 보세요.' })
  return out
}
