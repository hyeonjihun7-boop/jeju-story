import Mascot from './Mascot'
export { Mascot }

// 사이드바 로고: 바다색 배지 안의 귤룡
export default function Logo({ size = 34 }) {
  return (
    <span className="logo-badge" style={{ width: size, height: size }}>
      <Mascot size={size * 0.94} stars={false} />
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
