import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
// Bootstrap 5 기본 위에 숲녹색·연민트 테마(theme.css)를 덧입힙니다
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'
import './styles/jeju.css'
import './styles/cursor.css'
import { router } from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
