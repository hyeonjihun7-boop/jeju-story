// 제목에서 매체명·기호를 빼고, 같은 행사를 다룬 기사(공통 표현이 긴 제목)는 중복으로 본다
const norm = (t) => t.replace(/\s+[-–]\s+[^-–]+$/, '').replace(/[^0-9a-zA-Z가-힣]/g, '')
function commonRun(a, b) {
  let best = 0
  const prev = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    for (let j = b.length; j >= 1; j--) {
      prev[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : 0
      if (prev[j] > best) best = prev[j]
    }
  }
  return best
}
export function dedupe(items) {
  const kept = []
  for (const it of items) {
    const n = norm(it.title)
    if (!kept.some((k) => commonRun(k.n, n) >= 6)) kept.push({ n, it })
  }
  return kept.map((k) => k.it)
}
