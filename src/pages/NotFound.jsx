import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <h1 className="headline">길을 잃었어요</h1>
      <p className="sub">없는 주소예요. 오름에서는 길을 잃어도 괜찮지만요 🌿</p>
      <Link to="/" className="pillbtn text-decoration-none">탐험 제주로</Link>
    </div>
  )
}
