import type { ProductDetailGateway } from '@/services/ProductDetailGateway'

export const createFakeProductDetailGateway = (
  overrides: Partial<ProductDetailGateway> = {},
): ProductDetailGateway => ({
  fetchProductDetail: () => Promise.resolve(null),
  upsertPriceReport: () => Promise.reject(new Error('not expected')),
  deletePriceReport: () => Promise.resolve(),
  deleteProduct: () => Promise.resolve(),
  deleteReview: () => Promise.resolve(),
  addReaction: () => Promise.reject(new Error('not expected')),
  removeReaction: () => Promise.resolve(),
  ...overrides,
})
