import { toPng } from 'html-to-image'

// 화면의 한 덩어리를 사진(PNG)으로: 모바일은 공유 창, 그 외엔 내려받기
export async function shareNodeAsImage(node, fileTitle) {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, style: { margin: '0' } }) // 가운데 정렬 여백이 사진에 따라 들어와 잘리지 않게
  const name = `${fileTitle.replace(/[\\/:*?"<>|\s]+/g, '_')}.png`
  const file = new File([await (await fetch(dataUrl)).blob()], name, { type: 'image/png' })
  if (/Mobi|Android/i.test(navigator.userAgent) && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: fileTitle })
    return 'shared'
  }
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = name
  a.click()
  return 'downloaded'
}
