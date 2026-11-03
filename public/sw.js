// 탐험 제주 서비스 워커: 앱 껍데기를 저장해 두고, 오프라인이어도 화면이 열리게 한다 (API 응답은 저장하지 않음)
const CACHE = 'jeju-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/images/icon-192.png', '/images/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return

  // 화면 이동: 항상 최신을 먼저 받고, 실패(오프라인)하면 저장해 둔 첫 화면
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/')))
    return
  }
  // 빌드 파일·이미지: 저장본을 바로 쓰고 뒤에서 새로 받아 둔다
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) }
        return res
      }).catch(() => hit)
      return hit || net
    }),
  )
})
