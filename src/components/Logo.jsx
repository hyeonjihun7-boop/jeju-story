// 탐험 제주 마스코트 "귤룡": 굵은 외곽선의 납작한 스티커 스타일 귤 용 (직접 그린 SVG)
const LINE = { stroke: '#2a2623', strokeWidth: 3.4, strokeLinejoin: 'round', strokeLinecap: 'round' }

export function Mascot({ size = 80, title = '귤룡' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title}>
      {/* 꼬리 */}
      <path d="M62 82 Q84 86 88 70 Q80 74 74 68 Q82 64 80 56 Q68 62 64 74 Z" fill="#ffa12f" {...LINE} />
      {/* 껍질 날개 */}
      <path d="M36 60 Q14 52 11 68 Q19 66 22 73 Q27 66 36 68 Z" fill="#ffd48a" {...LINE} />
      <path d="M64 60 Q86 52 89 68 Q81 66 78 73 Q73 66 64 68 Z" fill="#ffd48a" {...LINE} />
      {/* 다리 */}
      <rect x="38" y="82" width="9" height="13" rx="4.5" fill="#ffa12f" {...LINE} />
      <rect x="53" y="82" width="9" height="13" rx="4.5" fill="#ffa12f" {...LINE} />
      {/* 팔 */}
      <rect x="29" y="58" width="8" height="20" rx="4" fill="#ffa12f" {...LINE} />
      <rect x="63" y="58" width="8" height="20" rx="4" fill="#ffa12f" {...LINE} />
      {/* 몸 + 귤 조각 배 */}
      <ellipse cx="50" cy="70" rx="18" ry="19" fill="#ffa12f" {...LINE} />
      <ellipse cx="50" cy="73" rx="10.5" ry="13" fill="#fff1d6" stroke="#2a2623" strokeWidth="2.4" />
      <path d="M50 60.5 V85.5 M43 64 Q41 73 44.5 83 M57 64 Q59 73 55.5 83" fill="none" stroke="#e8b676" strokeWidth="1.8" strokeLinecap="round" />
      {/* 뿔 */}
      <path d="M33 21 L28 7 L41 15 Z" fill="#ffa12f" {...LINE} />
      <path d="M67 21 L72 7 L59 15 Z" fill="#ffa12f" {...LINE} />
      {/* 머리 */}
      <circle cx="50" cy="37" r="24" fill="#ffa12f" {...LINE} />
      {/* 잎 */}
      <path d="M50 14 Q46 4 56 2 Q58 11 50 14 Z" fill="#58b85c" {...LINE} strokeWidth="2.8" />
      {/* 얼굴: 짧은 눈썹 · 점 눈 · 작은 웃음 */}
      <path d="M33 30 H42 M58 30 H67" fill="none" stroke="#2a2623" strokeWidth="3" strokeLinecap="round" />
      <circle cx="39" cy="38" r="2.6" fill="#2a2623" />
      <circle cx="61" cy="38" r="2.6" fill="#2a2623" />
      <path d="M44 46 Q50 52 56 46" fill="none" stroke="#2a2623" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="45" r="3.2" fill="#ff7f6b" opacity=".55" />
      <circle cx="68" cy="45" r="3.2" fill="#ff7f6b" opacity=".55" />
    </svg>
  )
}

// 사이드바 로고: 바다색 배지 안의 귤룡
export default function Logo({ size = 34 }) {
  return (
    <span className="logo-badge" style={{ width: size, height: size }}>
      <Mascot size={size * 0.94} />
    </span>
  )
}

// 히어로 배경 장식: 한라산 실루엣 + 오름 + 파도
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 420 150" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <circle cx="338" cy="34" r="20" fill="#ffb347" opacity=".9" />
      <path d="M0 150 V108 C60 104 108 88 150 66 L176 48 Q205 34 234 48 L262 66 C306 88 360 104 420 108 V150Z" fill="#fff" opacity=".16" />
      <path d="M0 150 V122 C40 112 70 116 96 124 C118 108 150 108 170 122 C230 112 300 118 420 128 V150Z" fill="#fff" opacity=".12" />
      <path d="M0 132 q14-9 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 V150H0Z" fill="#9fd3e6" opacity=".35" />
      <path d="M0 140 q14-9 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 V150H0Z" fill="#9fd3e6" opacity=".5" />
    </svg>
  )
}
