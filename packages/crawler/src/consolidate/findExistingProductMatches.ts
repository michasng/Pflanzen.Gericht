import type { ConsolidatedCandidate } from './candidate.js'
import type { ExistingProductSummary } from './loadExistingProducts.js'

export const findExistingProductMatches = (
  candidate: ConsolidatedCandidate,
  existingProducts: readonly ExistingProductSummary[],
): ExistingProductSummary[] => {
  const candidateUrls = new Set(candidate.prices.map((price) => price.sourceUrl))
  return existingProducts.filter((existing) =>
    existing.sourceUrls.some((url) => candidateUrls.has(url)),
  )
}
