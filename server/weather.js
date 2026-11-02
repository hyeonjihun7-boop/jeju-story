// get_weather: Open-Meteo 예보 (키 불필요) + 오늘의 시간대별 변화 요약
import { getJson, cached } from './http.js'
import { findPlace } from './geo.js'

const WMO = {
  0: ['맑음', 'brightness-high'], 1: ['대체로 맑음', 'brightness-alt-high'], 2: ['구름 조금', 'cloud-sun'], 3: ['흐림', 'cloudy'],
  45: ['안개', 'cloud-fog2'], 48: ['안개', 'cloud-fog2'],
  51: ['이슬비', 'cloud-drizzle'], 53: ['이슬비', 'cloud-drizzle'], 55: ['이슬비', 'cloud-drizzle'],
  61: ['비', 'cloud-rain'], 63: ['비', 'cloud-rain'], 65: ['강한 비', 'cloud-rain-heavy'],
  71: ['눈', 'cloud-snow'], 73: ['눈', 'cloud-snow'], 75: ['많은 눈', 'cloud-snow'],
  80: ['소나기', 'cloud-rain'], 81: ['소나기', 'cloud-rain-heavy'], 82: ['강한 소나기', 'cloud-rain-heavy'],
  95: ['뇌우', 'cloud-lightning-rain'], 96: ['뇌우·우박', 'cloud-lightning-rain'], 99: ['뇌우·우박', 'cloud-lightning-rain'],
}
export const describe = (code) => WMO[code] ?? ['알 수 없음', 'question-circle']

const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)
const r1 = (n) => Math.round(n * 10) / 10

export async function getWeather({ place = '제주시' } = {}) {
  const p = await findPlace({ name: place })
  const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
    latitude: p.lat, longitude: p.lon, timezone: 'Asia/Seoul', forecast_days: 2, wind_speed_unit: 'ms',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
  })
  const d = await cached('wx:' + p.lat + p.lon, 600e3, () => getJson(url))
  const today = d.current.time.slice(0, 10)

  // 오늘 06~22시 시간대별 변화
  const hourly = d.hourly.time.map((t, i) => ({
    hour: Number(t.slice(11, 13)), date: t.slice(0, 10),
    temp: d.hourly.temperature_2m[i], feel: d.hourly.apparent_temperature[i],
    pop: d.hourly.precipitation_probability[i] ?? 0, rain: d.hourly.precipitation[i] ?? 0,
    code: d.hourly.weather_code[i], wind: d.hourly.wind_speed_10m[i],
  })).filter((h) => h.date === today && h.hour >= 6 && h.hour <= 22)

  const at = (hr) => (hourly.find((h) => h.hour === hr) ?? hourly[0]).temp
  const [desc, icon] = describe(d.current.weather_code)
  const maxPop = Math.max(...hourly.map((h) => h.pop))
  const rainHours = hourly.filter((h) => h.pop >= 50 || h.rain >= 0.3).map((h) => h.hour)
  const peak = hourly.reduce((m, h) => (h.temp > m.temp ? h : m), hourly[0])
  // 최고기온 이전(아침)의 최저점 → 최고점 순서로 표현
  const before = hourly.filter((h) => h.hour <= peak.hour)
  const low = before.reduce((m, h) => (h.temp < m.temp ? h : m), before[0])
  const last = hourly.at(-1)
  const trend = []
  if (peak.temp - low.temp >= 1) trend.push(`${low.hour}시 ${low.temp}° → ${peak.hour}시 ${peak.temp}°`)
  trend.push(rainHours.length ? `${rainHours[0]}~${rainHours.at(-1)}시 사이 비 가능성` : '하루 종일 비 소식 없음')
  if (last.temp - peak.temp <= -4) trend.push(`저녁엔 ${last.temp}°까지 내려가요`)

  return {
    place: p.name, lat: p.lat, lon: p.lon,
    now: {
      temp: d.current.temperature_2m, feel: d.current.apparent_temperature, humidity: d.current.relative_humidity_2m,
      wind: d.current.wind_speed_10m, precip: d.current.precipitation, desc, icon, code: d.current.weather_code,
    },
    today: {
      max: d.daily.temperature_2m_max[0], min: d.daily.temperature_2m_min[0],
      range: r1(d.daily.temperature_2m_max[0] - d.daily.temperature_2m_min[0]),
      pop: d.daily.precipitation_probability_max[0] ?? maxPop, uv: d.daily.uv_index_max[0],
      sunrise: d.daily.sunrise[0].slice(11), sunset: d.daily.sunset[0].slice(11),
      avgFeel: r1(avg(hourly.filter((h) => h.hour >= 9 && h.hour <= 20).map((h) => h.feel))),
      maxWind: Math.max(...hourly.map((h) => h.wind)), rainHours, trend: trend.join(' · '),
      temps: { morning: at(8), noon: at(14), evening: at(20) },
      fogMorning: hourly.some((h) => h.hour <= 11 && (h.code === 45 || h.code === 48)),
      tomorrow: { pop: d.daily.precipitation_probability_max[1] ?? 0, max: d.daily.temperature_2m_max[1], min: d.daily.temperature_2m_min[1] },
    },
    hourly: hourly.map((h) => ({ ...h, label: describe(h.code)[0], icon: describe(h.code)[1] })),
    source: 'Open-Meteo',
  }
}
