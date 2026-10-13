import type { CrawlOptions } from '../../sites/types.js'

/** how many product URLs must be collected so that skipping and excluding still leaves `limit` products */
export const resolveCollectLimit = ({
  limit,
  skip,
  excludedProductUrls,
}: CrawlOptions): number | null => (limit === null ? null : skip + limit + excludedProductUrls.size)
