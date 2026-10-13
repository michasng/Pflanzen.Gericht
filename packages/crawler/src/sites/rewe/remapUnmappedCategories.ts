import type { Category } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type { ReweSiteDetails } from './reweSiteDetails.js'

export interface CategoryRemapResult {
  remappedProducts: CrawledProduct<ReweSiteDetails>[]
  unmappedCategorySlugs: string[]
}

export const remapUnmappedCategories = (
  products: readonly CrawledProduct<ReweSiteDetails>[],
  resolveCategory: (categorySlug: string | null) => Category | null,
): CategoryRemapResult => {
  const remappedProducts: CrawledProduct<ReweSiteDetails>[] = []
  const unmappedCategorySlugs = new Set<string>()
  for (const product of products) {
    if (product.category) continue
    const category = resolveCategory(product.siteDetails.categorySlug)
    if (category) remappedProducts.push({ ...product, category })
    else if (product.siteDetails.categorySlug)
      unmappedCategorySlugs.add(product.siteDetails.categorySlug)
  }
  return { remappedProducts, unmappedCategorySlugs: [...unmappedCategorySlugs].sort() }
}
