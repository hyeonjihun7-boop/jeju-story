import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const COLORS = { oreum: '#2c6b55', olle: '#3a8fb7', indoor: '#7a5fb0', tour: '#ff9f2e', food: '#d6402f', center: '#17261f' }

// 지도: Leaflet + OpenStreetMap 타일 (키 불필요). points = [{ id, kind, name, lat, lon, note }]
export default function MapView({ points, center, height = 340 }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([center?.lat ?? 33.38, center?.lon ?? 126.55], 10)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => { map.current.remove(); map.current = null }
  }, [center?.lat, center?.lon])

  useEffect(() => {
    const m = map.current
    if (!m) return
    layer.current.clearLayers()
    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    const bounds = []
    for (const p of valid) {
      L.circleMarker([p.lat, p.lon], { radius: 9, color: '#fff', weight: 2, fillColor: COLORS[p.kind] ?? COLORS.tour, fillOpacity: 0.95 })
        .bindPopup(`<b>${p.name}</b>${p.note ? `<br/>${p.note}` : ''}<br/><a href="https://map.naver.com/p/search/${encodeURIComponent(p.name)}" target="_blank" rel="noreferrer">네이버 지도</a>`)
        .addTo(layer.current)
      bounds.push([p.lat, p.lon])
    }
    if (center) {
      L.circleMarker([center.lat, center.lon], { radius: 6, color: COLORS.center, weight: 3, fillColor: '#fff', fillOpacity: 1 })
        .bindTooltip('기준 지역', { permanent: false }).addTo(layer.current)
      bounds.push([center.lat, center.lon])
    }
    if (bounds.length > 1) m.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
    else if (bounds.length === 1) m.setView(bounds[0], 12)
  }, [points, center])

  return <div ref={el} style={{ height, borderRadius: 22, overflow: 'hidden', zIndex: 0 }} role="img" aria-label="지도" />
}
