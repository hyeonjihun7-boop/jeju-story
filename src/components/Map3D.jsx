import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 3D 지도: 고도 타일(AWS Terrain Tiles)로 제주 지형을 솟게 하고, 그 위에 OpenStreetMap 지도를 입힌다 (키 불필요).
// MapView 와 같은 props: points = [{ id, kind, name, lat, lon, note, n?, approx?, img?, addr?, desc? }]
//  드래그: 회전 · 휠/핀치: 확대 · 오른쪽 드래그/두 손가락: 이동 · 핀을 누르면 정보 카드
const Z_H = 10 // 고도 타일 줌
const Z_T = 11 // 지도 그림 줌 (고도 타일 하나 = 지도 타일 4장)
const BOUNDS = { s: 33.10, n: 33.60, w: 126.10, e: 127.05 }
const S = 10 // 타일 한 장의 가로 길이(화면 단위)
const EXAG = 4 // 높이 과장 배수
const M_PER_UNIT = (40075016 * Math.cos((33.4 * Math.PI) / 180)) / 2 ** Z_H / S // 화면 1단위가 실제 몇 m 인가
const COLORS = { oreum: '#2c6b55', olle: '#3a8fb7', indoor: '#7a5fb0', indoorAll: '#9b7fd1', outdoorAll: '#e0762f', dark: '#5b4a6b', tour: '#ff9f2e', food: '#d6402f' }

const tx = (lon, z) => ((lon + 180) / 360) * 2 ** z
const ty = (lat, z) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z
}
const loadImg = (url) => new Promise((res, rej) => {
  const i = new Image()
  i.crossOrigin = 'anonymous'
  i.onload = () => res(i)
  i.onerror = () => rej(new Error('tile'))
  i.src = url
})

const GRID = (() => {
  const x0 = Math.floor(tx(BOUNDS.w, Z_H)), x1 = Math.floor(tx(BOUNDS.e, Z_H))
  const y0 = Math.floor(ty(BOUNDS.n, Z_H)), y1 = Math.floor(ty(BOUNDS.s, Z_H))
  return { x0, y0, cols: x1 - x0 + 1, rows: y1 - y0 + 1 }
})()

// 지형 데이터는 한 번만 내려받아 모든 3D 지도가 함께 쓴다
let terrainPromise = null
function loadTerrain() {
  if (terrainPromise) return terrainPromise
  const { x0, y0, cols, rows } = GRID
  terrainPromise = (async () => {
    const hc = document.createElement('canvas')
    hc.width = cols * 256
    hc.height = rows * 256
    const hx = hc.getContext('2d', { willReadFrequently: true })
    const tc = document.createElement('canvas')
    tc.width = cols * 512
    tc.height = rows * 512
    const tctx = tc.getContext('2d')
    tctx.fillStyle = '#aad3df'
    tctx.fillRect(0, 0, tc.width, tc.height)
    const jobs = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c, y = y0 + r
        jobs.push(loadImg(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z_H}/${x}/${y}.png`).then((im) => hx.drawImage(im, c * 256, r * 256)).catch(() => {}))
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            jobs.push(loadImg(`https://tile.openstreetmap.org/${Z_T}/${x * 2 + dx}/${y * 2 + dy}.png`).then((im) => tctx.drawImage(im, c * 512 + dx * 256, r * 512 + dy * 256)).catch(() => {}))
          }
        }
      }
    }
    await Promise.all(jobs)
    const px = hx.getImageData(0, 0, hc.width, hc.height).data
    const heights = new Float32Array(hc.width * hc.height)
    for (let i = 0; i < heights.length; i++) {
      const h = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768 // Terrarium 인코딩
      heights[i] = px[i * 4 + 3] === 0 ? 0 : Math.max(0, h) // 바다·빈 곳은 0
    }
    return { heights, width: hc.width, height: hc.height, texCanvas: tc }
  })().catch((e) => { terrainPromise = null; throw e })
  return terrainPromise
}

const pinCache = new Map()
function pinTexture({ color, n, approx }) {
  const key = `${color}|${n ?? ''}|${approx ? 1 : 0}`
  if (pinCache.has(key)) return pinCache.get(key)
  const c = document.createElement('canvas')
  c.width = c.height = 96
  const g = c.getContext('2d')
  g.beginPath()
  g.arc(48, 48, 38, 0, Math.PI * 2)
  g.fillStyle = approx ? '#8d9a94' : color
  g.fill()
  g.lineWidth = 8
  g.strokeStyle = '#ffffff'
  if (approx) g.setLineDash([12, 8])
  g.stroke()
  if (n) {
    g.setLineDash([])
    g.fillStyle = '#ffffff'
    g.font = '800 44px sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(String(n), 48, 51)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  pinCache.set(key, t)
  return t
}

export default function Map3D({ points, center, height = 340, route = false, fit = false, onFail }) {
  const host = useRef(null)
  const [state, setState] = useState('loading') // loading | ready
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    let disposed = false
    let renderer, controls, ro
    const el = host.current
    const { x0, y0, cols, rows } = GRID

    loadTerrain().then(({ heights, width, height: hgt, texCanvas }) => {
      if (disposed) return
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true })
      } catch {
        onFail?.()
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(el.clientWidth, el.clientHeight)
      el.appendChild(renderer.domElement)
      renderer.domElement.style.display = 'block'

      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#aad3df') // OpenStreetMap 바다색 — 판 가장자리가 티 나지 않게
      scene.add(new THREE.AmbientLight(0xffffff, 2.6))
      const sun = new THREE.DirectionalLight(0xffffff, 1.5)
      sun.position.set(-20, 30, 25)
      scene.add(sun)

      // 타일 좌표(실수) → 화면 좌표 · 지형 높이
      const toX = (tileX) => (tileX - x0 - cols / 2) * S
      const toZ = (tileY) => (tileY - y0 - rows / 2) * S
      const elevAt = (tileX, tileY) => {
        const px = Math.min(width - 1, Math.max(0, Math.round((tileX - x0) * 256)))
        const py = Math.min(hgt - 1, Math.max(0, Math.round((tileY - y0) * 256)))
        return (heights[py * width + px] / M_PER_UNIT) * EXAG
      }

      const W = cols * S, H = rows * S
      const geo = new THREE.PlaneGeometry(W, H, cols * 64, rows * 64)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const px = Math.round(((pos.getX(i) + W / 2) / W) * (width - 1))
        const py = Math.round(((H / 2 - pos.getY(i)) / H) * (hgt - 1))
        pos.setZ(i, (heights[py * width + px] / M_PER_UNIT) * EXAG)
      }
      geo.rotateX(-Math.PI / 2)
      geo.computeVertexNormals()
      const tex = new THREE.CanvasTexture(texCanvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 })))

      // 핀
      const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat >= BOUNDS.s && p.lat <= BOUNDS.n && p.lon >= BOUNDS.w && p.lon <= BOUNDS.e)
      const many = valid.length > 60
      const sprites = []
      const stakes = []
      const xz = valid.map((p) => {
        const tX = tx(p.lon, Z_H), tY = ty(p.lat, Z_H)
        return { p, x: toX(tX), z: toZ(tY), y: elevAt(tX, tY) }
      })
      for (const { p, x, z, y } of xz) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTexture({ color: COLORS[p.kind] ?? COLORS.tour, n: p.n, approx: p.approx }), depthTest: false, transparent: true }))
        const size = p.n ? 1.0 : many ? 0.45 : 0.7
        sp.scale.set(size, size, 1)
        sp.position.set(x, y + size * 0.9, z)
        sp.renderOrder = 10
        sp.userData.point = p
        scene.add(sp)
        sprites.push(sp)
        stakes.push(x, y, z, x, y + size * 0.5, z)
      }
      const stakeGeo = new THREE.BufferGeometry()
      stakeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stakes, 3))
      scene.add(new THREE.LineSegments(stakeGeo, new THREE.LineBasicMaterial({ color: 0x17261f })))

      if (route) {
        const line = xz.filter((o) => o.p.n).sort((a, b) => a.p.n - b.p.n).map((o) => new THREE.Vector3(o.x, o.y + 0.5, o.z))
        if (line.length > 1) {
          const curve = new THREE.CatmullRomCurve3(line, false, 'catmullrom', 0)
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, line.length * 12, 0.06, 6, false), new THREE.MeshBasicMaterial({ color: 0xff8f1f, depthTest: false, transparent: true, opacity: 0.9 }))
          tube.renderOrder = 9
          scene.add(tube)
        }
      }
      if (center && Number.isFinite(center.lat) && Number.isFinite(center.lon)) {
        const tX = tx(center.lon, Z_H), tY = ty(center.lat, Z_H)
        const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTexture({ color: '#17261f' }), depthTest: false, transparent: true }))
        ring.scale.set(0.5, 0.5, 1)
        ring.position.set(toX(tX), elevAt(tX, tY) + 0.4, toZ(tY))
        ring.renderOrder = 11
        scene.add(ring)
      }

      // 카메라: 핀이 모두 보이게(fit) 또는 제주 전체
      const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 400)
      let target = new THREE.Vector3(toX(tx(126.56, Z_H)), 0, toZ(ty(33.38, Z_H))) // 섬 중심
      let dist = W * 0.42
      if (fit && xz.length) {
        const xs = xz.map((o) => o.x), zs = xz.map((o) => o.z)
        target = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2)
        dist = Math.max(6, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) * 1.5)
      }
      camera.position.set(target.x, target.y + dist * 0.7, target.z + dist * 0.75)
      controls = new OrbitControls(camera, renderer.domElement)
      controls.target.copy(target)
      controls.maxPolarAngle = Math.PI / 2 - 0.08
      controls.minDistance = 2
      controls.maxDistance = 70
      controls.update()

      const render = () => renderer.render(scene, camera)
      controls.addEventListener('change', render)
      render()
      setState('ready')

      // 핀 누르기 (드래그와 구분)
      const ray = new THREE.Raycaster()
      let down = null
      const dom = renderer.domElement
      const onDown = (e) => { down = { x: e.clientX, y: e.clientY } }
      const onUp = (e) => {
        if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
        const r = dom.getBoundingClientRect()
        ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera)
        const hit = ray.intersectObjects(sprites)[0]
        setPicked(hit ? hit.object.userData.point : null)
      }
      dom.addEventListener('pointerdown', onDown)
      dom.addEventListener('pointerup', onUp)

      ro = new ResizeObserver(() => {
        if (!el.clientWidth) return
        renderer.setSize(el.clientWidth, el.clientHeight)
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
        render()
      })
      ro.observe(el)
    }).catch(() => { if (!disposed) onFail?.() })

    return () => {
      disposed = true
      ro?.disconnect()
      controls?.dispose()
      if (renderer) {
        renderer.dispose()
        renderer.domElement.remove()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, center, route, fit])

  const p = picked
  return (
    <div style={{ position: 'relative', height, borderRadius: 22, overflow: 'hidden', background: '#dcecf2' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} role="img" aria-label="제주도 3D 지도" />
      {state === 'loading' && <div className="map3d-loading">3D 지도를 불러오는 중…</div>}
      {state === 'ready' && !p && <div className="map3d-hint">드래그: 회전 · 휠/핀치: 확대 · 핀을 누르면 정보</div>}
      {p && (
        <div className="map3d-card">
          <button className="map3d-x" onClick={() => setPicked(null)} aria-label="닫기">×</button>
          <b>{p.n ? `${p.n}. ` : ''}{p.name}</b>
          {p.note && <div className="small">{p.note}</div>}
          {(p.img ?? '').startsWith('https://') && <img className="pin-img" src={p.img} alt={p.name} />}
          {p.addr && <div className="pin-addr">{p.addr}</div>}
          {p.desc && <div className="pin-desc">{p.desc}</div>}
          {p.approx && <div className="small sub">정확한 위치를 못 찾아 대략 표시했어요</div>}
          <div className="small mt-1">
            <a href={p.approx ? `https://map.kakao.com/link/search/${encodeURIComponent('제주 ' + p.name)}` : `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lon}`} target="_blank" rel="noreferrer">카카오 길찾기</a>
            {' · '}<a href={`https://map.naver.com/p/search/${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer">네이버 지도</a>
          </div>
        </div>
      )}
    </div>
  )
}
