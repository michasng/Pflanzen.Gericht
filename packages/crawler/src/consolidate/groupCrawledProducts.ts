import type { CrawledProduct } from '../schema/crawledProduct.js'
import type { Logger } from '../shared/logging/logger.js'
import { areProductsSameByFuzzyMatch } from './fuzzyMatch.js'
import type { ConsolidatedCandidate } from './candidate.js'

/**
 * Merges crawled products from multiple sites that fuzzy-match into one
 * another. The first site (by input order) to find a product supplies its
 * descriptive info; every matched site still contributes its own price.
 * Every match is logged, regardless of what happens afterwards.
 */
export const groupCrawledProductsBySameProduct = (
  crawledProducts: readonly CrawledProduct[],
  logger: Logger,
): ConsolidatedCandidate[] => {
  const candidates: ConsolidatedCandidate[] = []

  for (const product of crawledProducts) {
    const existingCandidate = candidates.find((candidate) =>
      areProductsSameByFuzzyMatch(candidate.primary, product),
    )
    const priceEntry = {
      site: product.site,
      sourceUrl: product.sourceUrl,
      priceEuroCents: product.priceEuroCents,
      salePriceEuroCents: product.salePriceEuroCents,
    }

    if (existingCandidate) {
      logger.info(
        `Duplicate match: "${product.name}" (${product.site}) matches "${existingCandidate.primary.name}" ` +
          `(${existingCandidate.primary.site}) - keeping ${existingCandidate.primary.site}'s product info, adding ${product.site}'s price.`,
      )
      existingCandidate.prices.push(priceEntry)
      continue
    }

    candidates.push({ primary: product, prices: [priceEntry] })
  }

  return candidates
}
