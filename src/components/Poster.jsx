import FavButton from './FavButton'
import NaviButton from './NaviButton'

// 포스터 카드: 이미지(없으면 대체 포스터) + 제목 + 기간
export default function Poster({ image, thumb, title, sub, href, fav, icon = 'balloon-heart', navi, refImage }) {
  const inner = (
    <>
      <div className="poster-img">
        {image ? <img src={image} alt={title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { if (thumb && e.currentTarget.src !== thumb) e.currentTarget.src = thumb }} /> : <div className="poster-ph"><i className={`bi bi-${icon}`} /><span>{title}</span></div>}
      </div>
      {refImage && image && <div className="poster-ref">참고 이미지</div>}
      <div className="poster-title">{title}</div>
      {sub && <div className="poster-sub">{sub}</div>}
    </>
  )
  return (
    <div className="poster">
      {href ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : inner}
      {navi && <div className="text-center"><NaviButton {...navi} /></div>}
      <span className="poster-fav"><FavButton {...fav} /></span>
    </div>
  )
}
