import { route } from '../server/handler.js'
import { getCulture } from '../server/culture.js'
export default route(() => getCulture())
