import type { Category } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import type { ReweSiteDetails } from './reweSiteDetails.js'

export interface CategoryMismatch {
  product: CrawledProduct<ReweSiteDetails>
  resolvedCategory: Category
}

export interface CategoryRemapResult {
  remappedProducts: CrawledProduct<ReweSiteDetails>[]
  mismatches: CategoryMismatch[]
  unmappedCategorySlugs: string[]
}

export const remapCategories = (
  products: readonly CrawledProduct<ReweSiteDetails>[],
  resolveCategory: (categorySlug: string | null) => Category | null,
): CategoryRemapResult => {
  const remappedProducts: CrawledProduct<ReweSiteDetails>[] = []
  const mismatches: CategoryMismatch[] = []
  const unmappedCategorySlugs = new Set<string>()
  for (const product of products) {
    const resolvedCategory = resolveCategory(product.siteDetails.categorySlug)
    if (!resolvedCategory) {
      if (!product.category && product.siteDetails.categorySlug)
        unmappedCategorySlugs.add(product.siteDetails.categorySlug)
      continue
    }
    if (!product.category) remappedProducts.push({ ...product, category: resolvedCategory })
    else if (product.category !== resolvedCategory) mismatches.push({ product, resolvedCategory })
  }
  return {
    remappedProducts,
    mismatches,
    unmappedCategorySlugs: [...unmappedCategorySlugs].sort(),
  }
}
