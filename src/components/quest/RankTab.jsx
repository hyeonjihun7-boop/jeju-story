import { useEffect, useState } from 'react'
import { levelOf } from '../../lib/quest'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { useQuestStore } from '../../store/useQuestStore'
import { Empty, Loading } from '../Status'

// 탐험가 랭킹: 서버(stamps)에 올라온 스탬프를 닉네임별로 세어 순위를 만든다. 데모 스탬프는 서버에 올라가지 않아 순위에 들어가지 않는다.
export default function RankTab() {
  const nickname = useAppStore((s) => s.nickname) || '익명'
  const mine = useQuestStore((s) => s.stamps.filter((x) => !x.demo).length)
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    if (!supabase) { setState({ off: true }); return }
    let alive = true
    supabase.from('stamps').select('nickname,spot_id').limit(5000).then(({ data, error }) => {
      if (!alive) return
      if (error) return setState({ error: error.code === 'PGRST205' ? 'stamps 테이블이 아직 없어요 (supabase/schema.sql 실행 필요)' : error.message })
      const m = new Map()
      for (const r of data) m.set(r.nickname, (m.get(r.nickname) ?? new Set()).add(r.spot_id))
      const rows = [...m.entries()].map(([name, set]) => ({ name, n: set.size })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'ko'))
      setState({ rows })
    })
    return () => { alive = false }
  }, [])

  if (state.loading) return <Loading text="랭킹을 불러오는 중…" />
  if (state.off) return <div className="kcard"><Empty text="Supabase 설정이 없어 랭킹을 볼 수 없어요" hint=".env.local 에 VITE_SUPABASE_URL / ANON_KEY 가 필요해요" /></div>
  if (state.error) return <div className="kcard small text-danger">{state.error}</div>

  const rows = state.rows
  const top = rows.slice(0, 10)
  const myRank = rows.findIndex((r) => r.name === nickname)
  const MEDAL = ['🥇', '🥈', '🥉']

  return (
    <div className="kcard">
      <h3><i className="bi bi-trophy-fill" />탐험가 랭킹 <span className="chip ms-1">{rows.length}명</span></h3>
      <div className="small sub mb-3">현장에서 인증한 스탬프 수로 순위를 매겨요. 닉네임이 같으면 기록이 합쳐져요.</div>
      {top.length === 0 ? <Empty text="아직 순위가 없어요" hint="탐험하기에서 현장 인증으로 첫 스탬프를 찍어 보세요" /> : (
        <ol className="q-rank">
          {top.map((r, i) => (
            <li key={r.name} className={r.name === nickname ? 'me' : ''}>
              <span className="q-rank-no">{MEDAL[i] ?? i + 1}</span>
              <span className="q-rank-name">{r.name}{r.name === nickname && <span className="chip ms-2">나</span>}</span>
              <span className="q-rank-lv small sub">{levelOf(r.n).name}</span>
              <b className="q-rank-n">{r.n}<small>곳</small></b>
            </li>
          ))}
        </ol>
      )}
      <div className="small mt-3">
        {myRank >= 0
          ? <>내 순위 <b>{myRank + 1}위</b> · 서버에 올라간 스탬프 {rows[myRank].n}곳</>
          : <span className="sub">{mine > 0 ? '아직 서버에 올라온 스탬프가 없어요. 잠시 뒤 새로고침해 보세요.' : `"${nickname}" 닉네임으로 올라온 스탬프가 아직 없어요. 현장 인증으로 찍으면 순위에 들어가요.`}</span>}
      </div>
      <div className="src">데모 모드 스탬프는 순위에 들어가지 않아요. 닉네임은 누구나 정할 수 있어서, 같은 이름을 쓰면 기록이 합쳐질 수 있어요.</div>
    </div>
  )
}
