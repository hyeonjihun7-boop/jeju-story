import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const Map3D = lazy(() => import('./Map3D')) // three.js 는 3D 지도를 열 때만 내려받는다

const COLORS = { oreum: '#2c6b55', olle: '#3a8fb7', indoor: '#7a5fb0', indoorAll: '#9b7fd1', outdoorAll: '#e0762f', dark: '#5b4a6b', tour: '#ff9f2e', food: '#d6402f', sea: '#3a8fb7', history: '#5b4a6b', nature: '#4c8a3c', center: '#17261f' }

// 제주도 전체가 보이는 범위 (마라도·가파도·우도 포함). 지도는 이 범위 안에서만 움직인다
const JEJU = L.latLngBounds([33.10, 126.10], [33.60, 127.05])
const inJeju = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && JEJU.contains([p.lat, p.lon])

// 지도: Leaflet + OpenStreetMap 타일 (키 불필요). points = [{ id, kind, name, lat, lon, note, n? }]
//  n 이 있으면 번호 핀(일정 순서), route 가 true 면 번호 순서대로 선을 잇고, fit 이면 핀이 모두 보이게 맞춘다
function MapLeaflet({ points, center, height = 340, route = false, fit = false }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)

  useEffect(() => {
    const m = L.map(el.current, { scrollWheelZoom: false, preferCanvas: true, minZoom: 9, maxBounds: JEJU.pad(0.4), maxBoundsViscosity: 0.8 })
    m.fitBounds(JEJU) // 항상 제주도 전체로 시작
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    layer.current.clearLayers()
    const valid = points.filter(inJeju)
    const many = valid.length > 60
    // 핀을 누르면 사진·주소·설명이 보이는 카드 (글은 모두 이스케이프)
    const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
    const card = (p) => `${(p.img ?? '').startsWith('https://') ? `<img class="pin-img" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"/>` : ''}${p.addr ? `<div class="pin-addr">${esc(p.addr)}</div>` : ''}${p.desc ? `<div class="pin-desc">${esc(p.desc)}</div>` : ''}`
    const popup = (p) => p.locked ? `<b>${esc(p.name)}</b>${p.note ? `<br/>${esc(p.note)}` : ''}` : `<b>${p.n ? p.n + '. ' : ''}${esc(p.name)}</b>${p.note ? `<br/>${esc(p.note)}` : ''}${card(p)}${p.approx ? '<br/><small>정확한 위치를 못 찾아 대략 표시했어요</small>' : ''}<br/><a href="${p.approx ? `https://map.kakao.com/link/search/${encodeURIComponent('제주 ' + p.name)}` : `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lon}`}" target="_blank" rel="noreferrer">카카오 길찾기</a> · <a href="https://map.naver.com/p/search/${encodeURIComponent(p.name)}" target="_blank" rel="noreferrer">네이버 지도</a>`

    if (route) {
      const line = valid.filter((p) => p.n).sort((a, b) => a.n - b.n).map((p) => [p.lat, p.lon])
      if (line.length > 1) L.polyline(line, { color: '#ff8f1f', weight: 3, opacity: 0.8, dashArray: '6 6' }).addTo(layer.current)
    }
    for (const p of valid) {
      if (p.n) {
        const icon = L.divIcon({ className: p.approx ? 'num-pin approx' : 'num-pin', html: `<span>${p.n}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] })
        L.marker([p.lat, p.lon], { icon }).bindPopup(popup(p), { minWidth: 200, maxWidth: 260 }).addTo(layer.current)
      } else {
        L.circleMarker([p.lat, p.lon], { radius: many ? 5 : 9, color: '#fff', weight: many ? 1 : 2, fillColor: p.locked ? '#6f7f8a' : COLORS[p.kind] ?? COLORS.tour, fillOpacity: p.locked ? 0.6 : 0.9, dashArray: p.locked ? '3 3' : undefined })
          .bindPopup(popup(p), { minWidth: 200, maxWidth: 260 }).addTo(layer.current)
      }
    }
    if (center && inJeju(center)) {
      L.circleMarker([center.lat, center.lon], { radius: 7, color: COLORS.center, weight: 3, fillColor: '#fff', fillOpacity: 1 })
        .bindTooltip('기준 지역', { permanent: false }).addTo(layer.current)
    }
    if (fit && valid.length) m.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lon])), { padding: [40, 40], maxZoom: 13 })
  }, [points, center, route, fit])

  return <div ref={el} style={{ height, borderRadius: 22, overflow: 'hidden', zIndex: 0 }} role="img" aria-label="제주도 지도" />
}

// 지도 한 곳: 3D(기본) / 2D 전환 버튼. 3D 를 못 쓰는 기기(WebGL 없음·타일 실패)는 자동으로 2D 로 돌아간다.
export default function MapView(props) {
  const [mode, setMode] = useState(() => { try { return localStorage.getItem('mapMode') || '3d' } catch { return '3d' } })
  const [failed, setFailed] = useState(false)
  const is3d = mode === '3d' && !failed
  const choose = (m) => {
    setMode(m)
    setFailed(false)
    try { localStorage.setItem('mapMode', m) } catch { /* 저장 못 해도 동작에는 문제 없음 */ }
  }
  return (
    <div style={{ position: 'relative' }}>
      {is3d ? (
        <Suspense fallback={<div className="map3d-loading" style={{ height: props.height ?? 340 }}>3D 지도를 불러오는 중…</div>}>
          <Map3D {...props} onFail={() => setFailed(true)} />
        </Suspense>
      ) : <MapLeaflet {...props} />}
      <button type="button" className="map-modebtn" onClick={() => choose(is3d ? '2d' : '3d')}>
        <i className={`bi bi-${is3d ? 'map' : 'badge-3d'}`} />{is3d ? '2D 지도' : '3D 지도'}
      </button>
      {failed && mode === '3d' && <div className="map3d-fail">이 기기에서는 3D 지도를 열 수 없어 2D로 보여드려요</div>}
    </div>
  )
}
