import { useEffect, useState } from 'react'

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

// 홈 화면에 추가(PWA 설치). 크롬·엣지는 설치 창을 띄우고, 사파리(iOS)는 방법을 안내한다.
export default function InstallButton() {
  const [evt, setEvt] = useState(null)
  const [done, setDone] = useState(false)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setEvt(e) }
    const onInstalled = () => { setDone(true); setEvt(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (done || standalone()) return null
  if (!evt && !isIos()) return null

  async function install() {
    if (evt) { evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null) } else setHelp(!help)
  }

  return (
    <div className="q-install">
      <button className="pillbtn" onClick={install}><i className="bi bi-phone me-1" />홈 화면에 앱 설치</button>
      {help && <small>사파리 아래 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요.</small>}
    </div>
  )
}
