// 옷 일러스트 (사진 대신 SVG) — g: 종류, color: 포인트 색
const STROKE = { stroke: 'rgba(23,38,31,.28)', strokeWidth: 1.5, strokeLinejoin: 'round' }

const SHAPES = {
  tee: (c) => <path d="M30 20 L42 14 Q50 24 58 14 L70 20 L86 36 L75 45 L69 39 V84 H31 V39 L25 45 L14 36 Z" fill={c} {...STROKE} />,
  shirt: (c) => (<><path d="M30 18 L42 13 L50 22 L58 13 L70 18 L88 70 L77 75 L68 46 V86 H32 V46 L23 75 L12 70 Z" fill={c} {...STROKE} /><path d="M50 22 V86 M42 13 L50 22 L58 13" fill="none" {...STROKE} /></>),
  longsleeve: (c) => <path d="M32 18 L44 13 Q50 22 56 13 L68 18 L89 72 L77 77 L67 45 V86 H33 V45 L23 77 L11 72 Z" fill={c} {...STROKE} />,
  knit: (c) => (<><path d="M32 18 L44 13 Q50 22 56 13 L68 18 L89 72 L77 77 L67 45 V86 H33 V45 L23 77 L11 72 Z" fill={c} {...STROKE} /><path d="M33 80 H67 M33 84 H67" fill="none" {...STROKE} /></>),
  cardigan: (c) => (<><path d="M32 18 L44 13 L50 24 L56 13 L68 18 L89 72 L77 77 L67 45 V88 H33 V45 L23 77 L11 72 Z" fill={c} {...STROKE} /><path d="M50 24 V88" fill="none" {...STROKE} /><circle cx="46" cy="42" r="1.8" fill="#fff" /><circle cx="46" cy="56" r="1.8" fill="#fff" /><circle cx="46" cy="70" r="1.8" fill="#fff" /></>),
  jacket: (c) => (<><path d="M31 16 L43 12 L50 22 L57 12 L69 16 L90 72 L78 77 L68 46 V90 H32 V46 L22 77 L10 72 Z" fill={c} {...STROKE} /><path d="M50 22 V90 M32 66 H44 M56 66 H68" fill="none" {...STROKE} /></>),
  coat: (c) => (<><path d="M30 14 L42 10 L50 24 L58 10 L70 14 L90 76 L78 81 L69 46 L71 96 H29 L31 46 L22 81 L10 76 Z" fill={c} {...STROKE} /><path d="M50 24 V96 M42 10 L50 38 L58 10" fill="none" {...STROKE} /></>),
  puffer: (c) => (<><path d="M30 14 L42 10 Q50 20 58 10 L70 14 L90 74 L78 79 L69 46 L70 92 H30 L31 46 L22 79 L10 74 Z" fill={c} {...STROKE} /><path d="M31 40 H69 M30 56 H70 M30 72 H70 M50 20 V92" fill="none" {...STROKE} /></>),
  pants: (c) => <path d="M31 10 H69 L74 92 H55 L50 38 L45 92 H26 Z" fill={c} {...STROKE} />,
  shorts: (c) => <path d="M29 20 H71 L76 66 H55 L50 44 L45 66 H24 Z" fill={c} {...STROKE} />,
  scarf: (c) => (<><path d="M24 28 Q50 44 76 28 V46 Q50 62 24 46 Z" fill={c} {...STROKE} /><path d="M58 50 L70 86 H56 L48 56 Z" fill={c} {...STROKE} /></>),
  sandal: (c) => (<><path d="M14 64 Q50 74 86 62 L88 74 Q50 88 12 78 Z" fill={c} {...STROKE} /><path d="M38 66 Q50 50 62 64" fill="none" {...STROKE} /></>),
  boot: (c) => <path d="M36 12 H60 V58 L84 68 V86 H30 L32 58 Z" fill={c} {...STROKE} />,
  umbrella: (c) => (<><path d="M12 50 Q50 -2 88 50 Q78 42 69 50 Q60 42 50 50 Q40 42 31 50 Q22 42 12 50 Z" fill={c} {...STROKE} /><path d="M50 50 V82 Q50 90 42 88" fill="none" {...STROKE} strokeWidth="3" /></>),
  hat: (c) => (<><path d="M24 58 Q26 28 50 28 Q74 28 76 58 Z" fill={c} {...STROKE} /><path d="M12 60 H88 Q88 70 50 70 Q12 70 12 60 Z" fill={c} {...STROKE} /></>),
  sun: (c) => (<><circle cx="50" cy="50" r="18" fill={c} {...STROKE} /><path d="M50 12 V24 M50 76 V88 M12 50 H24 M76 50 H88 M23 23 L31 31 M69 69 L77 77 M77 23 L69 31 M31 69 L23 77" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" /></>),
  mask: (c) => (<><path d="M22 36 H78 V62 Q50 82 22 62 Z" fill={c} {...STROKE} /><path d="M22 42 Q10 42 12 56 M78 42 Q90 42 88 56 M30 48 H70 M30 54 H70" fill="none" {...STROKE} /></>),
}

const COLORS = {
  tee: '#f4c2a1', shirt: '#cfe3f1', longsleeve: '#d9d3c4', knit: '#b9856b', cardigan: '#9fb6a3', jacket: '#7d8f9e', coat: '#c9ad8a', puffer: '#3b5b4c',
  pants: '#5c7894', shorts: '#8fb1c9', scarf: '#d6694a', sandal: '#c89b6a', boot: '#4a5a52', umbrella: '#3a8fb7', hat: '#e3c27d', sun: '#ff9f2e', mask: '#e9eef0',
}

export default function Garment({ g, size = 96 }) {
  const draw = SHAPES[g] ?? SHAPES.tee
  return <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={g}>{draw(COLORS[g] ?? '#cfd8d2')}</svg>
}
