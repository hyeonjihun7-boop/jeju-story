import { useEffect, useMemo, useRef, useState } from 'react'
import { SPOTS } from '../../data/spots'
import { haenyeoLines } from '../../lib/haenyeo'
import { moodKey, moodOf, overrideMood } from '../../lib/pixelMood'
import { dailyMissions } from '../../lib/quest'
import { useAppStore } from '../../store/useAppStore'
import { useQuestStore } from '../../store/useQuestStore'

// 탐험하기 맨 위 도트 풍경. 오늘의 날씨·시간대에 맞춰 하늘과 비·눈·노을·밤이 바뀌고, 해녀가 말풍선으로 날씨와 미션을 알려 준다.
// 화면에 보일 때만 움직이고, 탭이 숨겨지거나 "움직임 줄이기" 설정이면 멈춘다.
export default function PixelJeju({ spots = SPOTS }) {
  const ref = useRef(null)
  const sceneRef = useRef(null)
  const lastKey = useRef('')
  const today = useAppStore((s) => s.today)
  const stamps = useQuestStore((s) => s.stamps)
  const journal = useQuestStore((s) => s.journal)
  const courses = useQuestStore((s) => s.courses)
  const [clock, setClock] = useState(() => Date.now())
  const [li, setLi] = useState(0)

  // 10분마다 시간대(낮·노을·밤)를 다시 계산한다
  useEffect(() => { const id = setInterval(() => setClock(Date.now()), 600000); return () => clearInterval(id) }, [])
  const mood = useMemo(() => overrideMood(window.location.search, moodOf(today, new Date(clock))), [today, clock])
  const key = moodKey(mood)

  // 해녀의 말: 날씨 인사 → (바람) → 오늘의 미션 → 일지 안내
  const mission = useMemo(() => dailyMissions({ today, spots, stamps, journal, courses }).list[0], [today, spots, stamps, journal, courses])
  const lines = useMemo(() => haenyeoLines(mood, mission), [mood, mission])
  const line = lines[li % lines.length]
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setLi((n) => n + 1) }, 7000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    let alive = true, raf = 0, visible = true, last = 0, t0 = 0, clock0 = 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const tick = (ms) => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden) { t0 = 0; return }
      if (!t0) t0 = ms - clock0 * 1000
      if (ms - last < 42) return // 약 24프레임
      last = ms
      clock0 = (ms - t0) / 1000
      sceneRef.current.frame(clock0)
    }

    // 정지 레이어를 그리는 데 시간이 걸리므로 첫 화면이 뜬 뒤에 불러온다
    const start = () => import('../../lib/pixelJeju').then(({ createScene }) => {
      if (!alive) return
      const scene = createScene(canvas)
      sceneRef.current = scene
      scene.setMood(mood)
      lastKey.current = key
      if (reduce) { scene.frame(2.2); return }
      raf = requestAnimationFrame(tick)
    }).catch(() => {})
    const timer = setTimeout(start, 50)

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }) : null
    io?.observe(canvas)
    return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf); io?.disconnect(); sceneRef.current = null }
    // 장면은 한 번만 만들고, 날씨가 바뀌면 아래 effect 가 setMood 로 다시 그린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (sceneRef.current && lastKey.current !== key) {
      sceneRef.current.setMood(mood)
      lastKey.current = key
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) sceneRef.current.frame(2.2)
    }
  }, [key, mood])

  return (
    <div className="q-pixel">
      <canvas ref={ref} width="256" height="256" aria-hidden="true" />
      <button type="button" className="q-bubble" key={li % lines.length} onClick={() => setLi((n) => n + 1)} aria-label="해녀의 안내, 누르면 다음 말">
        <b>{line.jeju}</b>
        <small>{line.std}</small>
      </button>
    </div>
  )
}
