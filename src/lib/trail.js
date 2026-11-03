import { TRAILS } from '../data/courses'
import { OLLE_COURSES } from '../data/olle'

// 올레 코스별 진행: 시작점·종점을 둘 다 인증하면 완주 (좌표를 확인 못 한 코스는 안내만)
export function olleProgress(olle) {
  const got = new Map(olle.map((o) => [o.pointId, o]))
  return OLLE_COURSES.map((c) => {
    const hasGps = Boolean(c.a && c.b)
    const doneA = hasGps && got.has(c.a), doneB = hasGps && got.has(c.b)
    const complete = doneA && doneB
    return { ...c, hasGps, doneA, doneB, complete, at: complete ? [got.get(c.a).at, got.get(c.b).at].sort().pop() : null }
  })
}

// 방금 인증한 지점으로 새로 완주한 올레 코스들
export function olleNewlyCompleted(olle, pointId) {
  const before = olleProgress(olle)
  const after = olleProgress([...olle, { pointId, at: new Date().toISOString() }])
  return after.filter((c, i) => c.complete && !before[i].complete)
}

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
