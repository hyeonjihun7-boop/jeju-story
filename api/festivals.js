import { route } from '../server/handler.js'
import { searchFestivals } from '../server/tour.js'
export default route(async () => ({ items: await searchFestivals({}) }))
