import type { ProductEditingGateway } from '@/services/ProductEditingGateway'

export const createFakeProductEditingGateway = (
  overrides: Partial<ProductEditingGateway> = {},
): ProductEditingGateway => ({
  fetchProduct: () => Promise.resolve(null),
  fetchProductImages: () => Promise.resolve([]),
  fetchProductIngredients: () => Promise.resolve([]),
  fetchProductNutrients: () => Promise.resolve([]),
  fetchProductSources: () => Promise.resolve([]),
  fetchProductReviewImages: () => Promise.resolve([]),
  createProduct: () => Promise.reject(new Error('not expected')),
  updateProduct: () => Promise.resolve(),
  replaceProductIngredients: () => Promise.resolve(),
  replaceProductNutrients: () => Promise.resolve(),
  replaceProductSources: () => Promise.resolve(),
  uploadProductImage: () => Promise.reject(new Error('not expected')),
  deleteProductImage: () => Promise.resolve(),
  copyReviewImageToProduct: () => Promise.reject(new Error('not expected')),
  ...overrides,
})
