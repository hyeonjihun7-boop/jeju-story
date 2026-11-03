import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KINDS } from '../../data/spots'
import { badgesOf, dailyMissions, distanceM, fmtDist, getPosition, levelOf, MAX_ACC, streakOf } from '../../lib/quest'
import { newlyCompleted, trailsProgress } from '../../lib/trail'
import { useAppStore } from '../../store/useAppStore'
import { useQuestStore } from '../../store/useQuestStore'
import NaviButton from '../NaviButton'
import InstallButton from '../InstallButton'
import OlleCourses from './OlleCourses'
import ShareCard from './ShareCard'

// 레벨·칭호·오늘의 미션·스탬프판 (현재 위치가 장소 반경 안이면 스탬프 인증)
export default function StampTab({ spots, goTab }) {
  const { stamps, journal, courses, addStamp, resetStamps } = useQuestStore()
  const today = useAppStore((s) => s.today)
  const toast = useAppStore((s) => s.toast)
  const [pos, setPos] = useState(null) // { lat, lon, acc }
  const [busy, setBusy] = useState('')
  const [demo, setDemo] = useState(false)
  const [kind, setKind] = useState('all')
  const [card, setCard] = useState(false)
  const navigate = useNavigate()
  const sendMessage = useAppStore((s) => s.sendMessage)
  const chatLoading = useAppStore((s) => s.chatLoading)

  const stamped = new Map(stamps.map((s) => [s.spotId, s]))
  const lv = levelOf(stamps.length)
  const badges = badgesOf(stamps)
  const streak = streakOf(stamps, journal)
  const missions = dailyMissions({ today, spots, stamps, journal, courses })
  const trails = trailsProgress(stamps, spots)
  const trailsDone = trails.filter((t) => t.complete).length
  const dist = (s) => (pos ? distanceM(pos, s) : null)
  const shown = spots.filter((s) => kind === 'all' || s.kind === kind)
    .sort((a, b) => (pos ? dist(a) - dist(b) : 0))

  async function locate() {
    setBusy('locate')
    try { setPos(await getPosition()) } catch (e) { toast(e.message, 'warn') }
    setBusy('')
  }

  async function stamp(s) {
    if (stamped.has(s.id)) return
    const finished = () => newlyCompleted(stamps, spots, s.id)
    if (demo) { // 발표·시연용: 위치 확인 없이 찍는다 (서버 기록에는 올리지 않음)
      const t = finished()
      await addStamp(s, true)
      return toast(t ? `🏅 "${t.name}" 완주! (데모)` : `${s.name} 스탬프 (데모)`)
    }
    setBusy(s.id)
    try {
      const p = await getPosition()
      setPos(p)
      if (p.acc > MAX_ACC) return toast(`GPS 정확도가 낮아요 (오차 약 ${fmtDist(p.acc)}). 하늘이 트인 곳에서 다시 시도해 주세요`, 'warn')
      const d = distanceM(p, s)
      // 기기가 알려 준 오차(최대 150m)만큼은 너그럽게 봐 준다
      if (d <= s.r + Math.min(p.acc ?? 0, 150)) { const t = finished(); await addStamp(s); toast(t ? `🏅 "${t.name}" 완주!` : `${s.name} 스탬프 완료! 🍊`) }
      else toast(`${s.name}까지 ${fmtDist(d)} 남았어요 (반경 ${fmtDist(s.r)} 안에서 인증)`, 'warn')
    } catch (e) { toast(e.message, 'warn') }
    setBusy('')
  }

  // 스탬프 기록을 질문에 담아 AI 비서에게 넘긴다 (가 본 곳은 빼고, 안 가 본 곳으로 일정)
  function askAi(k) {
    const label = k === 'all' ? '장소' : KINDS[k].label
    const todo = spots.filter((s) => !stamped.has(s.id) && (k === 'all' || s.kind === k))
    if (todo.length === 0) return toast(`안 가 본 ${label}이 없어요. 대단해요!`)
    const seen = stamps.map((s) => s.name)
    const q = `내가 스탬프를 찍은 곳: ${seen.length ? seen.slice(0, 15).join(', ') : '아직 없음'}. 아직 안 가 본 ${label} 후보: ${todo.slice(0, 10).map((s) => s.name).join(', ')}. 이 후보 중에서 골라 1박 2일 제주 일정을 짜줘. 가 본 곳은 빼 줘.`
    sendMessage(q)
    navigate('/agent')
  }

  const pct = lv.next ? Math.round(((stamps.length - lv.from) / (lv.to - lv.from)) * 100) : 100

  return (
    <>
      <InstallButton />
      <div className="kcard q-level mb-3">
        <div className="q-level-top">
          <div className="q-lvbadge"><i className="bi bi-compass-fill" /><b>Lv.{lv.index + 1}</b></div>
          <div className="flex-grow-1">
            <div className="q-lvname">{lv.name}</div>
            <div className="small sub">스탬프 {stamps.length}개{lv.next ? ` · 다음 "${lv.next}"까지 ${lv.need}개` : ' · 최고 레벨!'}</div>
            <div className="meter mt-2"><span style={{ width: `${pct}%`, background: 'var(--citrus)' }} /></div>
            <div className="q-streak">
              <i className="bi bi-fire" />{streak.days > 0 ? `${streak.days}일 연속 탐험` : '오늘 첫 기록을 남겨 보세요'}
              {streak.title && <span className="chip">{streak.title}</span>}
              {streak.next && <small>{streak.days > 0 ? `${streak.need}일 더 이어 가면 "${streak.next}"` : `3일 연속이면 "${streak.next}"`}{streak.days > 0 && !streak.activeToday ? ' · 오늘 기록하면 이어져요' : ''}</small>}
            </div>
          </div>
        </div>
        <div className="q-badges">
          {badges.map((b) => (
            <div key={b.kind} className={`q-badge ${b.tier ? 'on' : ''}`} style={{ '--c': KINDS[b.kind].color }}>
              <i className={`bi bi-${KINDS[b.kind].icon}`} />
              <b>{b.title ?? KINDS[b.kind].label}</b>
              <small>{b.next ? `${b.n}/${b.next}곳${b.nextTitle ? ` → ${b.nextTitle}` : ''}` : `${b.n}곳 · 최고 칭호`}</small>
              <span className="q-stars">{[1, 2, 3].map((t) => <i key={t} className={`bi bi-star${b.tier >= t ? '-fill' : ''}`} />)}</span>
            </div>
          ))}
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center mt-3">
          <button className="pillbtn ghost" onClick={() => setCard(!card)}><i className="bi bi-award me-1" />{card ? '자랑 카드 닫기' : '자랑 카드 만들기'}</button>
          <span className="small sub ms-1">AI 비서에게 안 가 본 곳으로 1박 2일 부탁:</span>
          {['oreum', 'sea', 'history', 'all'].map((k) => (
            <button key={k} className="chip" disabled={chatLoading} onClick={() => askAi(k)}><i className="bi bi-stars" />{k === 'all' ? '전체' : KINDS[k].label}</button>
          ))}
        </div>
        {card && <ShareCard stamps={stamps} total={spots.length} />}
      </div>

      <div className="kcard mb-3">
        <h3><i className="bi bi-flag-fill" />오늘의 탐험 미션 <span className="chip ms-1">{missions.doneCount}/{missions.list.length}</span></h3>
        <div className="d-grid gap-2">
          {missions.list.map((m) => (
            <div key={m.id} className={`q-mission ${m.done ? 'done' : ''}`}>
              <i className={`bi bi-${m.done ? 'check-circle-fill' : m.icon} q-mi`} />
              <div className="flex-grow-1">
                <div className="fw-bold">{m.title}</div>
                <div className="small sub">{m.detail}</div>
                {m.target && !m.done && <div className="mt-1"><NaviButton name={m.target.name} lat={m.target.lat} lon={m.target.lon} /></div>}
              </div>
              {!m.done && m.tab && <button className="pillbtn ghost" onClick={() => goTab(m.tab)}>하러 가기</button>}
              {!m.done && m.target && <button className="pillbtn ghost" disabled={busy === m.target.id} onClick={() => stamp(m.target)}>{busy === m.target.id ? '확인 중…' : '스탬프'}</button>}
            </div>
          ))}
        </div>
        <div className="src">날씨와 날짜에 맞춰 매일 바뀌어요 (자정 기준). 날씨를 불러오지 못하면 기본 미션이 나와요.</div>
      </div>

      <div className="kcard mb-3">
        <h3><i className="bi bi-signpost-split-fill" />코스 완주 도전 <span className="chip ms-1">{trailsDone}/{trails.length} 완주</span></h3>
        <div className="q-trails">
          {trails.map((t) => {
            const next = t.places.find((p) => !t.got.has(p.id))
            return (
              <div key={t.id} className={`q-trail ${t.complete ? 'done' : ''}`} style={{ '--c': t.color }}>
                <div className="q-trail-top">
                  <i className={`bi bi-${t.complete ? 'award-fill' : t.icon} q-trail-ic`} />
                  <div className="flex-grow-1">
                    <div className="fw-bold">{t.name}</div>
                    <div className="small sub">{t.desc}</div>
                  </div>
                  <span className="q-trail-n">{t.done}/{t.total}</span>
                </div>
                <div className="meter"><span style={{ width: `${(t.done / t.total) * 100}%`, background: t.color }} /></div>
                <div className="q-trail-spots">
                  {t.places.map((p) => <span key={p.id} className={`q-tspot ${t.got.has(p.id) ? 'on' : ''}`}>{t.got.has(p.id) && <i className="bi bi-check-lg" />}{p.name}</span>)}
                </div>
                {t.complete
                  ? <div className="q-trail-ok"><i className="bi bi-patch-check-fill" />{new Date(t.at).toLocaleDateString('ko-KR')} 완주 인증 · 코스 배지 획득</div>
                  : <div className="d-flex gap-2 align-items-center flex-wrap"><span className="small sub">다음: <b>{next.name}</b></span><NaviButton name={next.name} lat={next.lat} lon={next.lon} /></div>}
              </div>
            )
          })}
        </div>
        <div className="src">코스에 묶인 장소를 모두 인증하면 완주 배지가 붙어요. 장소마다 GPS로 인증하고, 순서는 상관없어요.</div>
      </div>

      <OlleCourses demo={demo} />

      <div className="kcard">
        <h3><i className="bi bi-patch-check-fill" />스탬프판 <span className="chip ms-1">{stamps.length}/{spots.length}</span></h3>
        <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
          <button className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>전체</button>
          {Object.entries(KINDS).map(([k, v]) => (
            <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{v.label}</button>
          ))}
          <button className="pillbtn ghost ms-auto" onClick={locate} disabled={busy === 'locate'}>
            <i className="bi bi-geo-alt-fill me-1" />{busy === 'locate' ? '찾는 중…' : pos ? '위치 새로고침' : '내 위치로 거리 보기'}
          </button>
        </div>
        <label className="q-demo small mb-3">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          <span><b>데모 모드</b> — 현장에 없어도 스탬프를 찍어 볼 수 있어요 (시연용, “데모” 표시가 붙어요)</span>
        </label>
        <div className="q-grid">
          {shown.map((s) => {
            const got = stamped.get(s.id)
            const d = dist(s)
            return (
              <div key={s.id} className={`q-stamp ${got ? 'got' : ''}`} style={{ '--c': KINDS[s.kind].color }}>
                <div className="q-seal">{got ? <i className="bi bi-patch-check-fill" /> : <i className={`bi bi-${KINDS[s.kind].icon}`} />}</div>
                <div className="q-stamp-body">
                  <div className="fw-bold">{s.name} {s.ele && <span className="chip ms-1">{s.ele >= 300 ? '정상 도전 · ' : ''}해발 {s.ele}m</span>}</div>
                  <div className="small sub">{s.desc}</div>
                  <div className="small mt-1">
                    {got ? <span className="q-ok">{new Date(got.at).toLocaleDateString('ko-KR')} 인증{got.demo ? ' (데모)' : ''}</span>
                      : d != null ? <span className={d <= s.r ? 'q-ok' : 'sub'}>{d <= s.r ? '반경 안이에요! 스탬프를 찍어요' : `약 ${fmtDist(d)} 떨어져 있어요`}</span>
                      : <span className="sub">인증 반경 {fmtDist(s.r)}</span>}
                  </div>
                  <div className="d-flex gap-2 align-items-center flex-wrap mt-1">
                    {!got && <button className="pillbtn" disabled={busy === s.id} onClick={() => stamp(s)}>{busy === s.id ? '확인 중…' : demo ? '스탬프 (데모)' : '여기서 인증'}</button>}
                    <NaviButton name={s.name} lat={s.lat} lon={s.lon} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {stamps.length > 0 && (
          <div className="text-end mt-3">
            <button className="btn btn-link small text-danger p-0" onClick={() => { if (confirm('스탬프를 모두 지울까요? (이 기기와 서버에 저장된 내 닉네임 기록이 함께 지워져요)')) resetStamps() }}>스탬프 초기화</button>
          </div>
        )}
        <div className="src">위치는 이 기기의 GPS로만 확인하고 서버에 보내지 않아요. 스탬프 기록만 닉네임으로 저장돼요(Supabase 설정 시). 좌표는 대략 위치라 반경 안에 들어오면 인증돼요.</div>
      </div>
    </>
  )
}
