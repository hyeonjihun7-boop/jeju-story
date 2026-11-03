import { TRAILS } from '../data/courses'

// 코스별 진행: 완주한 장소 수, 완주 여부(마지막 스탬프 날짜)
export function trailsProgress(stamps, spots) {
  const got = new Map(stamps.map((s) => [s.spotId, s]))
  const byId = new Map(spots.map((s) => [s.id, s]))
  return TRAILS.map((t) => {
    const places = t.spots.map((id) => byId.get(id)).filter(Boolean)
    const done = places.filter((p) => got.has(p.id))
    const complete = places.length > 0 && done.length === places.length
    const at = complete ? done.map((p) => got.get(p.id).at).sort().pop() : null
    return { ...t, places, done: done.length, total: places.length, complete, at, got }
  })
}

// 방금 찍은 스탬프로 새로 완주한 코스(없으면 null)
export function newlyCompleted(stamps, spots, spotId) {
  const before = trailsProgress(stamps, spots)
  const after = trailsProgress([...stamps, { spotId, at: new Date().toISOString() }], spots)
  return after.find((t, i) => t.complete && !before[i].complete && t.spots.includes(spotId)) ?? null
}
