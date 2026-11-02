import { useAppStore } from '../store/useAppStore'

// 북마크 하트 — Supabase favorites 와 연결
export default function FavButton({ kind, id, title, note }) {
  const on = useAppStore((s) => s.favorites.some((f) => f.kind === kind && f.item_id === String(id)))
  const toggle = useAppStore((s) => s.toggleFavorite)
  return (
    <button className="favbtn" aria-label="북마크" onClick={() => toggle({ kind, id, title, note })}>
      <i className={`bi bi-bookmark-heart${on ? '-fill' : ''}`} />
    </button>
  )
}
