// 카카오맵 길찾기(도착지 지정) 링크 — 키 없이 동작, 모바일은 카카오맵 앱에서 "내비 시작"으로 카카오내비 연결
// 좌표가 있으면 정확한 도착지, 없으면 "제주 + 이름" 검색으로 연결
export const naviUrl = ({ name, lat, lon }) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) && lat != null && lon != null
    ? `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lon}`
    : `https://map.kakao.com/link/search/${encodeURIComponent('제주 ' + name)}`

export default function NaviButton({ name, lat, lon, label = '카카오 길찾기' }) {
  return (
    <a className="navibtn" href={naviUrl({ name, lat, lon })} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      <i className="bi bi-geo-alt-fill" />{label}
    </a>
  )
}
