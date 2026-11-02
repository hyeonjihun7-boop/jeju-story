import { route } from '../server/handler.js'
import { SHOPS } from '../server/data/curated.js'
export default route((q) => ({ items: q.cat ? SHOPS.filter((s) => s.cat === q.cat) : SHOPS }))
