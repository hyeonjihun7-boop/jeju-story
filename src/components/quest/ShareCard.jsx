import { useRef, useState } from 'react'
import { KINDS } from '../../data/spots'
import { badgesOf, levelOf, streakOf } from '../../lib/quest'
import { useQuestStore } from '../../store/useQuestStore'
import { shareNodeAsImage } from '../../lib/shareImage'
import { useAppStore } from '../../store/useAppStore'

const EMOJI = { oreum: '⛰️', sea: '🌊', history: '🕯️', food: '🍊', nature: '🌲' }
const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n)

// 스탬프 자랑 카드: 레벨·칭호·스탬프 수를 한 장 사진으로. 아이콘 글꼴은 사진에 안 들어가므로 이모지·글자만 쓴다.
export default function ShareCard({ stamps, total }) {
  const nickname = useAppStore((s) => s.nickname) || '익명 탐험가'
  const toast = useAppStore((s) => s.toast)
  const box = useRef(null)
  const [busy, setBusy] = useState(false)
  const lv = levelOf(stamps.length)
  const badges = badgesOf(stamps)
  const journal = useQuestStore((s) => s.journal)
  const streak = streakOf(stamps, journal)
  const recent = [...stamps].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5)
  const pct = total ? Math.round((stamps.length / total) * 100) : 0

  async function save() {
    setBusy(true)
    try { await shareNodeAsImage(box.current, `${nickname}_탐험카드`) }
    catch (e) { if (e?.name !== 'AbortError') toast('이미지를 만들지 못했어요', 'danger') }
    setBusy(false)
  }

  return (
    <div className="mt-3">
      <div className="q-card" ref={box}>
        <div className="q-card-brand">🍊 탐험 제주</div>
        <div className="q-card-lv">Lv.{lv.index + 1}</div>
        <div className="q-card-name">{lv.name}</div>
        <div className="q-card-nick">{nickname}</div>
        {streak.days > 0 && <div className="q-card-streak">🔥 {streak.days}일 연속 탐험{streak.title ? ` · ${streak.title}` : ''}</div>}
        <div className="q-card-count"><b>{stamps.length}</b> / {total}곳 탐험 · {pct}%</div>
        <div className="q-card-bar"><span style={{ width: `${pct}%` }} /></div>
        <div className="q-card-badges">
          {badges.map((b) => (
            <div key={b.kind}>
              <span className="q-card-em">{EMOJI[b.kind]}</span>
              <b>{b.title ?? KINDS[b.kind].label}</b>
              <small>{stars(b.tier)} · {b.n}곳</small>
            </div>
          ))}
        </div>
        {recent.length > 0 && <div className="q-card-recent">최근 스탬프 · {recent.map((s) => s.name).join(' · ')}</div>}
        <div className="q-card-foot">jeju-story.vercel.app · {new Date().toLocaleDateString('ko-KR')}</div>
      </div>
      <div className="text-end mt-2">
        <button className="pillbtn" disabled={busy} onClick={save}><i className="bi bi-image me-1" />{busy ? '만드는 중…' : '이미지로 저장·공유'}</button>
      </div>
    </div>
  )
}
