import { slugifyProductName } from './slugifyProductName.js'

const FALLBACK_SLUG = 'unknown-product'

// Falls back to a slug derived from the source URL so products with an unreadable name don't collide into one file.
export const resolveProductSlug = (name: string, sourceUrl: string): string => {
  const nameSlug = slugifyProductName(name)
  if (nameSlug) return nameSlug
  const lastUrlSegment = sourceUrl.split('/').filter(Boolean).pop() ?? ''
  return slugifyProductName(lastUrlSegment) || FALLBACK_SLUG
}
