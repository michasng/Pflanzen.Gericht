export interface ReweSiteDetails {
  categorySlug: string | null
}

export const isReweSiteDetails = (value: unknown): value is ReweSiteDetails =>
  typeof value === 'object' &&
  value !== null &&
  'categorySlug' in value &&
  (typeof value.categorySlug === 'string' || value.categorySlug === null)
