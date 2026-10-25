import type { ProductWithImages } from '@/services/profile'
import { createProduct } from '@/__tests__/createProduct'

export const createProductWithImages = (
  overrides: Partial<ProductWithImages> = {},
): ProductWithImages => ({
  ...createProduct(),
  images: [],
  ...overrides,
})
