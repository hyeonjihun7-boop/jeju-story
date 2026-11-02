// 오늘의 기온 변화(선) + 강수확률(막대) — 외부 차트 라이브러리 없이 SVG 로 직접 그림
export default function HourlyChart({ hourly }) {
  if (!hourly?.length) return null
  const W = 640, H = 170, padX = 22, top = 18, base = 130
  const temps = hourly.map((h) => h.temp)
  const lo = Math.min(...temps) - 1, hi = Math.max(...temps) + 1
  const x = (i) => padX + (i * (W - padX * 2)) / (hourly.length - 1)
  const y = (t) => top + ((hi - t) / (hi - lo)) * (base - top - 24)
  const line = hourly.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(h.temp).toFixed(1)}`).join(' ')
  const nowH = (new Date().getUTCHours() + 9) % 24
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="시간대별 기온과 강수확률">
      {hourly.map((h, i) => (
        <rect key={h.hour} x={x(i) - 9} y={base - h.pop * 0.28} width="18" height={h.pop * 0.28} rx="5"
          fill="#3a8fb7" opacity={h.pop >= 50 ? 0.55 : 0.2} />
      ))}
      <path d={line} fill="none" stroke="#1d4a3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {hourly.map((h, i) => (
        <g key={h.hour}>
          <circle cx={x(i)} cy={y(h.temp)} r={h.hour === nowH ? 6 : 3.5} fill={h.hour === nowH ? '#ff9f2e' : '#1d4a3a'} />
          {i % 2 === 0 && <text x={x(i)} y={y(h.temp) - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#17261f">{Math.round(h.temp)}°</text>}
          {i % 2 === 0 && <text x={x(i)} y={base + 18} textAnchor="middle" fontSize="11" fill="#5f7469">{h.hour}시</text>}
          {i % 2 === 0 && h.pop >= 30 && <text x={x(i)} y={base + 32} textAnchor="middle" fontSize="10" fill="#3a8fb7">{h.pop}%</text>}
        </g>
      ))}
    </svg>
  )
}
