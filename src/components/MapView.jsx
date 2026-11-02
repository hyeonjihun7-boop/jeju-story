import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const COLORS = { oreum: '#2c6b55', olle: '#3a8fb7', indoor: '#7a5fb0', indoorAll: '#9b7fd1', outdoorAll: '#e0762f', tour: '#ff9f2e', food: '#d6402f', center: '#17261f' }

// 제주도 전체가 보이는 범위 (마라도·가파도·우도 포함). 지도는 이 범위 안에서만 움직인다
const JEJU = L.latLngBounds([33.10, 126.10], [33.60, 127.05])
const inJeju = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && JEJU.contains([p.lat, p.lon])

// 지도: Leaflet + OpenStreetMap 타일 (키 불필요). points = [{ id, kind, name, lat, lon, note }]
export default function MapView({ points, center, height = 340 }) {
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
    const many = points.length > 60
    for (const p of points.filter(inJeju)) {
      L.circleMarker([p.lat, p.lon], { radius: many ? 5 : 9, color: '#fff', weight: many ? 1 : 2, fillColor: COLORS[p.kind] ?? COLORS.tour, fillOpacity: 0.9 })
        .bindPopup(`<b>${p.name}</b>${p.note ? `<br/>${p.note}` : ''}<br/><a href="https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lon}" target="_blank" rel="noreferrer">카카오 길찾기</a> · <a href="https://map.naver.com/p/search/${encodeURIComponent(p.name)}" target="_blank" rel="noreferrer">네이버 지도</a>`)
        .addTo(layer.current)
    }
    if (center && inJeju(center)) {
      L.circleMarker([center.lat, center.lon], { radius: 7, color: COLORS.center, weight: 3, fillColor: '#fff', fillOpacity: 1 })
        .bindTooltip('기준 지역', { permanent: false }).addTo(layer.current)
    }
  }, [points, center])

  return <div ref={el} style={{ height, borderRadius: 22, overflow: 'hidden', zIndex: 0 }} role="img" aria-label="제주도 지도" />
}
