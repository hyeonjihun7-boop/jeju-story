import { useAppStore } from '../store/useAppStore'

const PLACES = ['제주시', '애월', '한림', '중문', '서귀포', '표선', '성산', '구좌', '우도']

export default function PlacePicker() {
  const place = useAppStore((s) => s.place)
  const loadToday = useAppStore((s) => s.loadToday)
  return (
    <div className="d-flex gap-2 flex-wrap">
      {PLACES.map((p) => (
        <button key={p} className={`chip ${p === place ? 'on' : ''}`} onClick={() => loadToday(p)}>{p}</button>
      ))}
    </div>
  )
}
