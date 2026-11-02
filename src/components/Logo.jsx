// 탐험 제주 로고: 한라산 + 감귤 해 + 파도 (SVG)
export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="탐험 제주 로고">
      <rect width="48" height="48" rx="13" fill="#1f5a63" />
      <circle cx="33" cy="15" r="6.5" fill="#ff9f2e" />
      <path d="M2 36 L13 27 Q17 24 21 25 L24 22.5 Q27 21 30 23 L34 27 L46 36 Z" fill="#e9f3ee" />
      <path d="M0 38 q6-4 12 0 t12 0 t12 0 t12 0 V48 H0Z" fill="#3a8fb7" />
      <path d="M0 42.5 q6-4 12 0 t12 0 t12 0 t12 0 V48 H0Z" fill="#2c6b9a" opacity=".85" />
    </svg>
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
