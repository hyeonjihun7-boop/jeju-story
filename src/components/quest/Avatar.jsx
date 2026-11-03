import { useEffect, useRef } from 'react'
import { AVATAR_H, AVATAR_ORIGIN, AVATAR_SKY, AVATAR_W, drawAvatar } from '../../lib/avatar'

// 내 탐험가: 레벨이 오를 때마다 모습이 달라지는 도트 캐릭터. 화면에 보일 때만 숨 쉬듯 움직이고, 움직임 줄이기 설정이면 멈춘다.
export default function Avatar({ level = 0, animate = true, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined
    const g = cv.getContext('2d')
    const draw = (t) => { g.clearRect(0, 0, AVATAR_W, AVATAR_H); drawAvatar(g, AVATAR_ORIGIN[0], AVATAR_ORIGIN[1], level, t) }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    draw(0.4)
    if (!animate || reduce) return undefined
    let raf = 0, visible = true, last = 0
    const loop = (ms) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden || ms - last < 66) return // 약 15프레임이면 충분하다
      last = ms
      draw(ms / 1000)
    }
    raf = requestAnimationFrame(loop)
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }) : null
    io?.observe(cv)
    return () => { cancelAnimationFrame(raf); io?.disconnect() }
  }, [level, animate])

  const sky = AVATAR_SKY[Math.max(0, Math.min(5, level))]
  return (
    <div className={`q-avatar ${className}`} style={{ '--sky': sky }}>
      <canvas ref={ref} width={AVATAR_W} height={AVATAR_H} aria-label={`레벨 ${level + 1} 탐험가 캐릭터`} role="img" />
      <b>Lv.{level + 1}</b>
    </div>
  )
}
