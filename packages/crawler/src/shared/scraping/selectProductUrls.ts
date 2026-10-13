import type { CrawlOptions } from '../../sites/types.js'

export const selectProductUrls = (
  productUrls: readonly string[],
  { skip, limit, excludedProductUrls }: CrawlOptions,
): string[] =>
  productUrls
    .slice(skip)
    .filter((productUrl) => !excludedProductUrls.has(productUrl))
    .slice(0, limit ?? undefined)
