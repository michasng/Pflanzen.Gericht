import { extractSlugFromUrlPath } from '../../shared/output/extractSlugFromUrlPath.js'

// REWE product URLs end with /{name}/{id}; the name alone might not be unique
const PRODUCT_SLUG_PATH_SEGMENT_COUNT = 2

export const extractReweProductSlug = (sourceUrl: string): string =>
  extractSlugFromUrlPath(sourceUrl, PRODUCT_SLUG_PATH_SEGMENT_COUNT)
