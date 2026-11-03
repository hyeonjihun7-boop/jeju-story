import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchDark } from '../api/client'
import { historySpots, SPOTS } from '../data/spots'
import { useAppStore } from '../store/useAppStore'
import { useQuestStore } from '../store/useQuestStore'
import StampTab from '../components/quest/StampTab'
import QuestMap from '../components/quest/QuestMap'
import CourseTab from '../components/quest/CourseTab'
import JournalTab from '../components/quest/JournalTab'

const TABS = [
  { key: 'stamp', label: '스탬프·미션', icon: 'patch-check-fill' },
  { key: 'map', label: '안개 지도', icon: 'cloud-fog2-fill' },
  { key: 'course', label: '코스 만들기', icon: 'signpost-split-fill' },
  { key: 'journal', label: '탐험 일지', icon: 'journal-richtext' },
]

// 탐험하기: 스탬프 도장깨기 · 레벨/칭호 · 오늘의 미션 · 안개 지도 · 코스 공유 · 일지
export default function Quest() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'stamp'
  const setTab = (t) => setParams(t === 'stamp' ? {} : { tab: t }, { replace: true })
  const nickname = useAppStore((s) => s.nickname)
  const syncStamps = useQuestStore((s) => s.syncStamps)
  const [dark, setDark] = useState([])

  // 역사 장소는 서버(TourAPI)에서 좌표를 받아온다 — 실패해도 오름·바다·맛집은 그대로 쓴다
  useEffect(() => { fetchDark().then((d) => setDark(historySpots(d.items))).catch(() => {}) }, [])
  useEffect(() => { syncStamps() }, [nickname, syncStamps])
  const spots = useMemo(() => [...SPOTS, ...dark], [dark])

  return (
    <>
      <div className="mb-3">
        <h1 className="headline">제주 <em>탐험하기</em></h1>
        <div className="sub mb-3">가 보고, 도장 찍고, 기록하고, 코스로 나눠요</div>
        <div className="modebar">
          {TABS.map((t) => (
            <button key={t.key} className={`modebtn ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`bi bi-${t.icon}`} />{t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'stamp' && <StampTab spots={spots} goTab={setTab} />}
      {tab === 'map' && <QuestMap spots={spots} />}
      {tab === 'course' && <CourseTab spots={spots} />}
      {tab === 'journal' && <JournalTab spots={spots} />}
    </>
  )
}
