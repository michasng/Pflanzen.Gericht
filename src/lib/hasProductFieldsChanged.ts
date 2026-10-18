import { haveSameElements } from '@/lib/haveSameElements'
import type { Product } from '@/types'
import type { ProductFields } from '@/types/productForm'

export const hasProductFieldsChanged = (product: Product, fields: ProductFields): boolean =>
  product.name !== fields.name ||
  product.category !== fields.category ||
  product.base !== fields.base ||
  product.brand !== fields.brand ||
  product.description !== fields.description ||
  product.energyJoules !== fields.energyJoules ||
  product.isOrganic !== fields.isOrganic ||
  product.barcode !== fields.barcode ||
  product.quantityUnit !== fields.quantityUnit ||
  product.quantityValue !== fields.quantityValue ||
  !haveSameElements(product.allergens, fields.allergens, (allergen) => allergen)
