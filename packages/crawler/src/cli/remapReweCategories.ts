import { loadCrawledOutputs } from '../shared/output/loadCrawledOutputs.js'
import { writeProductJson } from '../shared/output/writeProductJson.js'
import { createLogger } from '../shared/logging/logger.js'
import { isReweSiteDetails, type ReweSiteDetails } from '../sites/rewe/reweSiteDetails.js'
import { resolveCategoryFromSlug } from '../sites/rewe/resolveCategoryFromSlug.js'
import { remapCategories } from '../sites/rewe/remapCategories.js'
import type { CrawledProduct } from '../schema/crawledProduct.js'
import { askShouldOverrideCategory } from './askShouldOverrideCategory.js'

const logger = createLogger('rewe')

const toReweProduct = (product: CrawledProduct): CrawledProduct<ReweSiteDetails> | null =>
  isReweSiteDetails(product.siteDetails) ? { ...product, siteDetails: product.siteDetails } : null

const crawledProducts = await loadCrawledOutputs(['rewe'])
const unmappedProducts = crawledProducts.filter((product) => !product.category)
const unmappedWithoutSiteDetailsCount = unmappedProducts.filter(
  (product) => !isReweSiteDetails(product.siteDetails),
).length
if (unmappedWithoutSiteDetailsCount) {
  logger.warn(
    `${unmappedWithoutSiteDetailsCount} unmapped product(s) have no categorySlug; re-crawl them.`,
  )
}

const reweProducts = crawledProducts.flatMap((product) => toReweProduct(product) ?? [])
const { remappedProducts, mismatches, unmappedCategorySlugs } = remapCategories(
  reweProducts,
  resolveCategoryFromSlug,
)
for (const product of remappedProducts) await writeProductJson('rewe', product)
logger.info(`Mapped ${remappedProducts.length} of ${unmappedProducts.length} unmapped product(s).`)

let overriddenCount = 0
for (const mismatch of mismatches) {
  if (!(await askShouldOverrideCategory(mismatch))) continue
  await writeProductJson('rewe', { ...mismatch.product, category: mismatch.resolvedCategory })
  overriddenCount++
}
if (mismatches.length) {
  logger.info(
    `Overrode ${overriddenCount} of ${mismatches.length} product(s) whose category differed from the mapping.`,
  )
}

if (unmappedCategorySlugs.length) {
  logger.info(`Still unmapped categorySlugs:\n${unmappedCategorySlugs.join('\n')}`)
}
