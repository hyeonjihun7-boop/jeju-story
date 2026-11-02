// get_air_quality / get_station_air
// Open-Meteo 대기질(키 불필요) 기본 + 에어코리아(DATA_GO_KR_KEY 있으면 실측값) 보강
import { getJson, cached } from './http.js'
import { findPlace } from './geo.js'

// 환경부 기준 (㎍/㎥): 좋음 / 보통 / 나쁨 / 매우나쁨
const BANDS = { pm10: [30, 80, 150], pm25: [15, 35, 75] }
export const GRADES = ['좋음', '보통', '나쁨', '매우나쁨']

export function grade(kind, v) {
  if (v == null) return { level: -1, label: '정보없음' }
  const i = BANDS[kind].findIndex((max) => v <= max)
  const level = i === -1 ? 3 : i
  return { level, label: GRADES[level] }
}

export async function getAirQuality({ place = '제주시' } = {}) {
  const p = await findPlace({ name: place })
  const url = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + new URLSearchParams({
    latitude: p.lat, longitude: p.lon, timezone: 'Asia/Seoul', forecast_days: 2,
    current: 'pm10,pm2_5,dust,ozone,european_aqi',
    hourly: 'pm10,pm2_5,dust',
  })
  const d = await cached('aq:' + p.lat + p.lon, 600e3, () => getJson(url))
  const today = d.current.time.slice(0, 10)
  const idx = d.hourly.time.map((t, i) => [t, i]).filter(([t]) => t.startsWith(today))
  const peakPm10 = Math.max(...idx.map(([, i]) => d.hourly.pm10[i] ?? 0))
  const peakDust = Math.max(...idx.map(([, i]) => d.hourly.dust[i] ?? 0))
  const pm10 = grade('pm10', d.current.pm10)
  const pm25 = grade('pm25', d.current.pm2_5)
  // 황사: 먼지(dust) 농도와 PM10이 함께 높을 때만 경고
  const yellowDust = peakDust >= 100 && peakPm10 >= 80 ? 2 : peakDust >= 50 && peakPm10 >= 50 ? 1 : 0
  const level = Math.max(pm10.level, pm25.level, yellowDust === 2 ? 2 : 0)
  return {
    place: p.name,
    now: { pm10: d.current.pm10, pm25: d.current.pm2_5, dust: d.current.dust, ozone: d.current.ozone, aqi: d.current.european_aqi },
    grade: { pm10, pm25, overall: { level, label: GRADES[level] ?? '정보없음' } },
    yellowDust: { level: yellowDust, label: ['황사 없음', '황사 약함', '황사 주의'][yellowDust], peak: Math.round(peakDust) },
    peakPm10: Math.round(peakPm10),
    hourly: idx.filter(([t]) => Number(t.slice(11, 13)) % 3 === 0)
      .map(([t, i]) => ({ hour: Number(t.slice(11, 13)), pm10: d.hourly.pm10[i], pm25: d.hourly.pm2_5[i] })),
    source: 'Open-Meteo Air Quality',
  }
}

// ── 에어코리아 (공공데이터포털) — 키 필요 ───────────────
const AIRKOREA = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc'

export async function getStationAir({ station = '' } = {}) {
  if (!process.env.DATA_GO_KR_KEY) {
    return { available: false, reason: 'DATA_GO_KR_KEY 가 없어 에어코리아 실측값을 건너뜁니다' }
  }
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, returnType: 'json', numOfRows: '100', pageNo: '1', sidoName: '제주', ver: '1.3',
  })
  const data = await cached('airkorea:jeju', 600e3, () => getJson(`${AIRKOREA}/getCtprvnRltmMesureDnsty?${params}`))
  const items = data?.response?.body?.items
  if (!items) throw new Error('에어코리아 응답 형식 오류 (활용신청·키 종류를 확인하세요)')
  const rows = items.map((i) => ({
    station: i.stationName, time: i.dataTime, pm10: Number(i.pm10Value) || null, pm25: Number(i.pm25Value) || null,
    pm10Grade: grade('pm10', Number(i.pm10Value) || null).label, pm25Grade: grade('pm25', Number(i.pm25Value) || null).label,
  }))
  const hit = station ? rows.filter((r) => r.station.includes(station)) : rows
  return { available: true, stations: (hit.length ? hit : rows).slice(0, 12), source: '에어코리아 실시간 측정' }
}
