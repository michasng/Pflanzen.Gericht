import type { Base } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../schema/crawledProduct.js'
import type { BaseRemapping } from './baseRemapping.js'

export const remapBases = (
  products: readonly CrawledProduct[],
  resolveBase: (ingredientsRawText: string | null) => Base | null,
): BaseRemapping => {
  const remapping: BaseRemapping = { changedProducts: [], unresolvedProducts: [] }
  for (const product of products) {
    const base = resolveBase(product.ingredientsRawText)
    const remappedProduct = { ...product, base }
    if (base !== product.base) remapping.changedProducts.push(remappedProduct)
    if (base === null) remapping.unresolvedProducts.push(remappedProduct)
  }
  return remapping
}
