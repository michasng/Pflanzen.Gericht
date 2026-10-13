import type { Category, QuantityUnit } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../schema/crawledProduct.js'

export interface RequiredProductFields {
  category: Category
  brand: string
  quantityUnit: QuantityUnit
  quantityValue: number
}

export const resolveRequiredProductFields = ({
  category,
  brand,
  quantityUnit,
  quantityValue,
}: CrawledProduct): RequiredProductFields | null => {
  if (!category || !brand || quantityUnit === null || quantityValue === null) return null
  return { category, brand, quantityUnit, quantityValue }
}
