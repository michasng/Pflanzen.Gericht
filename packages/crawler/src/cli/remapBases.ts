import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { writeProductJson } from '../shared/output/writeProductJson.js'
import { createLogger } from '../shared/logging/logger.js'
import { resolveBaseFromIngredients } from '../shared/resolveBaseFromIngredients.js'
import { remapBases } from '../shared/remapBases.js'
import { SITE_CRAWLERS } from '../sites/index.js'

const logger = createLogger('remap-bases')

const crawledProducts = await loadCrawledOutputs(SITE_CRAWLERS.map((crawler) => crawler.id))
const { changedProducts, unresolvedProducts } = remapBases(
  crawledProducts,
  resolveBaseFromIngredients,
)
for (const product of changedProducts) await writeProductJson(product.site, product)

logger.info(
  `Changed the base of ${changedProducts.length} of ${crawledProducts.length} product(s); ${unresolvedProducts.length} product(s) have no resolvable base.`,
)
