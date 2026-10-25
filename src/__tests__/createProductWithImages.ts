import type { ProductWithImages } from '@/lib/ProductWithImages'
import { createProduct } from '@/__tests__/createProduct'

export const createProductWithImages = (
  overrides: Partial<ProductWithImages> = {},
): ProductWithImages => ({
  ...createProduct(),
  images: [],
  ...overrides,
})
