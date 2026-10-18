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
  fetchProductActivityCounts: () =>
    Promise.resolve({ reviewsCount: 0, priceReportsCount: 0, similarityVotesCount: 0 }),
  fetchPublicProfile: () => Promise.resolve(null),
  searchSimilarProducts: () => Promise.resolve([]),
  mergeProducts: () => Promise.reject(new Error('not expected')),
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
