import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { writeProductJson } from '../shared/output/writeProductJson.js'
import { createLogger } from '../shared/logging/logger.js'
import { isReweSiteDetails, type ReweSiteDetails } from '../sites/rewe/reweSiteDetails.js'
import { resolveCategoryFromSlug } from '../sites/rewe/resolveCategoryFromSlug.js'
import { remapUnmappedCategories } from '../sites/rewe/remapUnmappedCategories.js'
import type { CrawledProduct } from '../schema/crawledProduct.js'

const logger = createLogger('rewe')

const toReweProduct = (product: CrawledProduct): CrawledProduct<ReweSiteDetails> | null =>
  isReweSiteDetails(product.siteDetails) ? { ...product, siteDetails: product.siteDetails } : null

const crawledProducts = await loadCrawledOutputs(['rewe'])
const unmappedProducts = crawledProducts.filter((product) => !product.category)
const reweProducts = unmappedProducts.flatMap((product) => toReweProduct(product) ?? [])
const withoutSiteDetailsCount = unmappedProducts.length - reweProducts.length
if (withoutSiteDetailsCount) {
  logger.warn(`${withoutSiteDetailsCount} unmapped product(s) have no categorySlug; re-crawl them.`)
}

const { remappedProducts, unmappedCategorySlugs } = remapUnmappedCategories(
  reweProducts,
  resolveCategoryFromSlug,
)
for (const product of remappedProducts) await writeProductJson('rewe', product)

logger.info(`Mapped ${remappedProducts.length} of ${unmappedProducts.length} unmapped product(s).`)
if (unmappedCategorySlugs.length) {
  logger.info(`Still unmapped categorySlugs:\n${unmappedCategorySlugs.join('\n')}`)
}
