import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Itinerary, { parseItinerary } from '../components/Itinerary'
import { ErrorBox, Loading } from '../components/Status'

// 공유 링크로 열리는 일정 한 장 (/trip/:id) — 링크를 아는 사람은 누구나 볼 수 있어요
export default function TripShare() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    if (!supabase) return setState({ error: 'Supabase 설정이 없어 일정을 불러올 수 없어요' })
    supabase.from('trips').select('id,title,content,created_at').eq('id', id).maybeSingle()
      .then(({ data, error }) => setState(error ? { error: error.message } : data ? { trip: data } : { error: '일정을 찾을 수 없어요. 삭제됐거나 주소가 달라요.' }))
  }, [id])

  if (state.loading) return <Loading text="일정을 불러오는 중..." />
  if (state.error) return <ErrorBox error={state.error} />
  const { trip } = state
  const plan = parseItinerary(trip.content)
  return (
    <>
      <div className="mb-3">
        <div className="sub"><i className="bi bi-share me-1" />공유된 여행 일정 · {new Date(trip.created_at).toLocaleDateString('ko-KR')}</div>
        <h1 className="headline">{trip.title}</h1>
      </div>
      {plan ? <Itinerary plan={plan} title={trip.title} /> : <div className="msg assistant">{trip.content}</div>}
      <div className="text-center mt-3">
        <Link to="/agent" className="pillbtn text-decoration-none"><i className="bi bi-stars me-1" />나도 일정 만들어 보기</Link>
      </div>
    </>
  )
}
