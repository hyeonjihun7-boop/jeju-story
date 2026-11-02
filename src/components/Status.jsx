import { Spinner } from 'react-bootstrap'

export function Loading({ text = '불러오는 중...' }) {
  return <div className="text-center py-5 sub"><Spinner animation="border" size="sm" className="me-2" />{text}</div>
}
export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="kcard" style={{ background: '#fde4e1' }}><i className="bi bi-exclamation-triangle me-2" />{String(error)}</div>
}
export function Empty({ text = '결과가 없어요', hint }) {
  return (
    <div className="text-center py-5 sub">
      <i className="bi bi-inbox fs-2 d-block mb-2" />{text}
      {hint && <div className="small mt-1">{hint}</div>}
    </div>
  )
}
