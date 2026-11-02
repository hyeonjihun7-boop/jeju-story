import { route } from '../server/handler.js'
import { searchNews, getIssueJeju } from '../server/news.js'
// /api/news?src=issue (이슈제주 RSS) | ?q=키워드 (네이버/구글뉴스)
export default route((q) => (q.src === 'issue' ? getIssueJeju({}) : searchNews({ query: q.q || '제주' })))
