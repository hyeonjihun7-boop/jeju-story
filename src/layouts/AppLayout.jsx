import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../router'
import { useAppStore } from '../store/useAppStore'

export default function AppLayout() {
  const toasts = useAppStore((s) => s.toasts)
  const nickname = useAppStore((s) => s.nickname)
  const loadToday = useAppStore((s) => s.loadToday)
  const loadFavorites = useAppStore((s) => s.loadFavorites)

  useEffect(() => { loadToday() }, [loadToday])
  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])

  const links = NAV_ITEMS.map((n) => (
    <NavLink key={n.to} to={n.to} end={n.to === '/'}>
      <i className={`bi bi-${n.icon}`} /><span>{n.label}</span>
    </NavLink>
  ))

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand"><i className="bi bi-tree-fill" />오늘의 제주</div>
        {links}
        <div className="foot">공공데이터 · AI 에이전트<br />Open-Meteo · OSM · TourAPI</div>
      </aside>
      <main className="main"><Outlet /></main>
      <nav className="tabbar">{links}</nav>
      <div className="toastbox">{toasts.map((t) => <div key={t.id} className={t.variant}>{t.message}</div>)}</div>
    </div>
  )
}
