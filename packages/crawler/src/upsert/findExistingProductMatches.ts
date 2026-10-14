import type { ExistingProductSummary } from './loadExistingProducts.js'

export const findExistingProductMatches = (
  sourceUrl: string,
  existingProducts: readonly ExistingProductSummary[],
): ExistingProductSummary[] =>
  existingProducts.filter((existing) => existing.sourceUrls.includes(sourceUrl))
