import type { CrawledProduct } from '../schema/crawledProduct.js'

export interface BaseRemapping {
  /** Products whose resolved base differs from their stored one, carrying the resolved base. */
  changedProducts: CrawledProduct[]
  /** Products whose ingredients resolve to no base, whether changed or not. */
  unresolvedProducts: CrawledProduct[]
}
