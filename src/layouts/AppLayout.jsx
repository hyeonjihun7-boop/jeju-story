import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../router'
import { useAppStore } from '../store/useAppStore'
import Logo from '../components/Logo'
import InstallButton from '../components/InstallButton'
import FxLayer from '../components/FxLayer'

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
        <div className="brand"><Logo size={38} /><span>탐험 제주<small>혼저 옵서예</small></span></div>
        {links}
        <div className="foot"><InstallButton /><span className="foot-wave" aria-hidden="true" />공공데이터 · AI 에이전트<br />Open-Meteo · TourAPI · 카카오<br /><em>폭삭 속았수다 🍊</em></div>
      </aside>
      <main className="main"><Outlet /></main>
      <nav className="tabbar">{links}</nav>
      <FxLayer />
      <div className="toastbox">{toasts.map((t) => <div key={t.id} className={t.variant}>{t.message}</div>)}</div>
    </div>
  )
}
