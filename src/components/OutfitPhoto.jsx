import { useEffect, useState } from 'react'
import { fetchOutfitPhoto } from '../api/client'
import Garment from './Garment'

// 옷 카드 이미지: 실제 상품 사진을 시도하고, 없으면 일러스트로 대체
export default function OutfitPhoto({ g }) {
  const [photo, setPhoto] = useState(null)
  useEffect(() => {
    let alive = true
    fetchOutfitPhoto(g).then((d) => alive && d.found && setPhoto(d)).catch(() => {})
    return () => { alive = false }
  }, [g])
  if (!photo) return <Garment g={g} size={110} />
  return (
    <a href={photo.link} target="_blank" rel="noreferrer" className="outfit-photo" title={photo.title}>
      <img src={photo.image} alt={photo.title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { if (photo.thumb && e.currentTarget.src !== photo.thumb) e.currentTarget.src = photo.thumb }} />
      {photo.price && <span className="outfit-price">{photo.price.toLocaleString()}원~</span>}
    </a>
  )
}

