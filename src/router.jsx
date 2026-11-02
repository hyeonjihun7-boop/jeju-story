import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Eat from './pages/Eat'
import Issue from './pages/Issue'
import Agent from './pages/Agent'
import My from './pages/My'
import NotFound from './pages/NotFound'
import TripShare from './pages/TripShare'

// 메뉴 한 곳에서 관리: 페이지 추가 = ① pages/ 파일 ② NAV_ITEMS 한 줄 ③ routes 한 줄
export const NAV_ITEMS = [
  { to: '/', label: '오늘', icon: 'sun' },
  { to: '/explore', label: '탐험', icon: 'compass' },
  { to: '/eat', label: '먹거리·쇼핑', icon: 'bag-heart' },
  { to: '/issue', label: '이슈', icon: 'newspaper' },
  { to: '/agent', label: 'AI 비서', icon: 'stars' },
  { to: '/my', label: '북마크', icon: 'bookmark-heart' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'explore', element: <Explore /> },
      { path: 'eat', element: <Eat /> },
      { path: 'issue', element: <Issue /> },
      { path: 'agent', element: <Agent /> },
      { path: 'my', element: <My /> },
      { path: 'trip/:id', element: <TripShare /> }, // 공유 링크
    ],
  },
])
