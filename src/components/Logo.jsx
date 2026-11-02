// 탐험 제주 마스코트 "귤룡": 껍질 날개를 단 귀여운 귤 용 (직접 그린 SVG)
export function Mascot({ size = 80, title = '귤룡' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title}>
      {/* 꼬리 */}
      <path d="M66 82 Q86 84 88 66 Q80 72 72 70 Q80 66 82 58 Q70 62 66 72Z" fill="#ff9a2e" />
      {/* 껍질 날개 */}
      <path d="M33 58 Q10 50 8 66 Q18 62 22 70 Q26 62 34 66Z" fill="#ffc47a" />
      <path d="M67 58 Q90 50 92 66 Q82 62 78 70 Q74 62 66 66Z" fill="#ffc47a" />
      {/* 몸 */}
      <ellipse cx="50" cy="68" rx="21" ry="22" fill="#ff9a2e" />
      <ellipse cx="50" cy="70" rx="13.5" ry="16.5" fill="#ffe6bd" />
      <path d="M50 54 V86 M42 58 Q38 70 43 84 M58 58 Q62 70 57 84" fill="none" stroke="#ffcf94" strokeWidth="1.6" strokeLinecap="round" />
      {/* 팔·발 */}
      <ellipse cx="31" cy="66" rx="5.5" ry="8" fill="#ff9a2e" transform="rotate(18 31 66)" />
      <ellipse cx="69" cy="66" rx="5.5" ry="8" fill="#ff9a2e" transform="rotate(-18 69 66)" />
      <ellipse cx="40" cy="89" rx="8" ry="4.6" fill="#ff8a1f" />
      <ellipse cx="60" cy="89" rx="8" ry="4.6" fill="#ff8a1f" />
      {/* 뿔·귀 */}
      <ellipse cx="34" cy="18" rx="5" ry="8" fill="#ff9a2e" transform="rotate(-24 34 18)" />
      <ellipse cx="66" cy="18" rx="5" ry="8" fill="#ff9a2e" transform="rotate(24 66 18)" />
      {/* 머리 */}
      <circle cx="50" cy="35" r="20" fill="#ff9a2e" />
      <ellipse cx="50" cy="42" rx="13" ry="9.5" fill="#ffe6bd" />
      {/* 잎 */}
      <path d="M50 16 Q47 7 55 5 Q56 12 50 16Z" fill="#4caf50" />
      <path d="M50 16 Q54 10 60 11 Q58 17 50 16Z" fill="#6cc56a" />
      {/* 얼굴 */}
      <circle cx="42.5" cy="36" r="2.8" fill="#2b2a2a" />
      <circle cx="57.5" cy="36" r="2.8" fill="#2b2a2a" />
      <circle cx="43.4" cy="35" r=".9" fill="#fff" />
      <circle cx="58.4" cy="35" r=".9" fill="#fff" />
      <circle cx="35.5" cy="42" r="3" fill="#ff7f6b" opacity=".45" />
      <circle cx="64.5" cy="42" r="3" fill="#ff7f6b" opacity=".45" />
      <path d="M45.5 43.5 Q50 48.5 54.5 43.5" fill="none" stroke="#7a3b16" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="50" cy="40.8" rx="2.4" ry="1.5" fill="#e98a52" />
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
