import { useEffect, useRef } from 'react'

// 탐험하기 맨 위 도트 풍경. 화면에 보일 때만 움직이고, 탭이 숨겨지거나 "움직임 줄이기" 설정이면 멈춘다.
export default function PixelJeju() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    let alive = true, raf = 0, scene = null, visible = true, last = 0, t0 = 0, clock = 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const tick = (ms) => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden) { t0 = 0; return }
      if (!t0) t0 = ms - clock * 1000
      if (ms - last < 42) return // 약 24프레임
      last = ms
      clock = (ms - t0) / 1000
      scene.frame(clock)
    }

    // 정지 레이어를 그리는 데 시간이 걸리므로 첫 화면이 뜬 뒤에 불러온다
    const start = () => import('../../lib/pixelJeju').then(({ createScene }) => {
      if (!alive) return
      scene = createScene(canvas)
      if (reduce) { scene.frame(2.2); return }
      raf = requestAnimationFrame(tick)
    }).catch(() => {})
    const timer = setTimeout(start, 50)

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }) : null
    io?.observe(canvas)
    return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf); io?.disconnect() }
  }, [])

  return (
    <div className="q-pixel" aria-hidden="true">
      <canvas ref={ref} width="256" height="256" />
    </div>
  )
}
