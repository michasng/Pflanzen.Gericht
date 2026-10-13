import type { CrawledProduct, SiteId } from '../schema/crawledProduct.js'

export interface CandidatePriceEntry {
  site: SiteId
  sourceUrl: string
  priceEuroCents: number
  salePriceEuroCents: number | null
}

export interface ConsolidatedCandidate {
  /** descriptive info from the first site that found this product */
  primary: CrawledProduct
  prices: CandidatePriceEntry[]
}
