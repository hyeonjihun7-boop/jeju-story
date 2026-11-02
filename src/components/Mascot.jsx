// 탐험 제주 마스코트 "귤룡": 통통한 콩 모양에 신나게 웃는 귤 용 (직접 그린 SVG)
const OUT = '#6b3e26'
const line = { stroke: OUT, strokeWidth: 2.8, strokeLinejoin: 'round', strokeLinecap: 'round' }

const Star = ({ x, y, s = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 L2.1 -2.4 L7 -2 L3.3 1.4 L4.4 6.3 L0 3.8 L-4.4 6.3 L-3.3 1.4 L-7 -2 L-2.1 -2.4 Z"
    fill="#ffd54a" stroke="#e8a82e" strokeWidth="1.6" strokeLinejoin="round" />
)

export default function Mascot({ size = 80, title = '귤룡', stars = true }) {
  return (
    <svg width={size} height={size} viewBox="-6 -6 112 112" role="img" aria-label={title}>
      {stars && <><Star x={14} y={16} s={1.1} /><Star x={88} y={12} s={1.3} /><Star x={93} y={38} s={0.8} /></>}
      {/* 등 가시 + 꼬리 */}
      <path d="M77 24 L87 28 L79 36 Z M80 40 L90 45 L80 52 Z M77 56 L87 62 L77 68 Z" fill="#ee8420" {...line} />
      <path d="M72 80 Q98 86 97 66 Q89 76 77 70 Z" fill="#ffa12f" {...line} />
      {/* 팔 (번쩍 든) */}
      <path d="M26 60 Q11 56 8 41" fill="none" stroke={OUT} strokeWidth="13" strokeLinecap="round" />
      <path d="M26 60 Q11 56 8 41" fill="none" stroke="#ffa12f" strokeWidth="7.8" strokeLinecap="round" />
      <path d="M74 60 Q89 56 92 41" fill="none" stroke={OUT} strokeWidth="13" strokeLinecap="round" />
      <path d="M74 60 Q89 56 92 41" fill="none" stroke="#ffa12f" strokeWidth="7.8" strokeLinecap="round" />
      {/* 발 */}
      <ellipse cx="38" cy="93" rx="11" ry="5.5" fill="#ffa12f" {...line} />
      <ellipse cx="62" cy="93" rx="11" ry="5.5" fill="#ffa12f" {...line} />
      {/* 머리+몸 한 덩어리 */}
      <path d="M50 9 C30 9 20 24 21 40 C21 52 27 58 26 70 C25 82 30 92 42 92 L58 92 C70 92 75 82 74 70 C73 58 79 52 79 40 C80 24 70 9 50 9 Z" fill="#ffa12f" {...line} />
      <ellipse cx="50" cy="73" rx="14" ry="16.5" fill="#ffe9c4" />
      <path d="M50 58 V88 M43 61 Q41 74 44.5 86 M57 61 Q59 74 55.5 86" fill="none" stroke="#f0c98d" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="37" cy="22" rx="7" ry="3.4" fill="#fff" opacity=".55" transform="rotate(-30 37 22)" />
      {/* 뿔 + 잎 */}
      <path d="M33 14 L28 3 L41 9 Z" fill="#ee8420" {...line} />
      <path d="M67 14 L72 3 L59 9 Z" fill="#ee8420" {...line} />
      <path d="M50 11 Q46 1 56 -1 Q58 8 50 11 Z" fill="#58b85c" {...line} strokeWidth="2.4" />
      {/* 얼굴: 눈 감고 활짝 */}
      <path d="M34 38 Q39 32 44 38 M56 38 Q61 32 66 38" fill="none" stroke={OUT} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M41 45 Q50 60 59 45 Z" fill="#e8455f" {...line} strokeWidth="2.4" />
      <path d="M45 54 Q50 57.5 55 54 Q50 50 45 54 Z" fill="#ff9aab" />
      <circle cx="30" cy="47" r="5" fill="#ff8f9c" opacity=".7" />
      <circle cx="70" cy="47" r="5" fill="#ff8f9c" opacity=".7" />
    </svg>
  )
}
