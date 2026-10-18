import type { ReviewEditingGateway } from '@/services/ReviewEditingGateway'

export const createFakeReviewEditingGateway = (
  overrides: Partial<ReviewEditingGateway> = {},
): ReviewEditingGateway => ({
  fetchProduct: () => Promise.resolve(null),
  fetchProductImages: () => Promise.resolve([]),
  fetchReviewForEdit: () => Promise.resolve(null),
  createReview: () => Promise.reject(new Error('not expected')),
  updateReview: () => Promise.resolve(),
  uploadReviewImage: () => Promise.reject(new Error('not expected')),
  deleteReviewImage: () => Promise.resolve(),
  copyProductImageToReview: () => Promise.reject(new Error('not expected')),
  ...overrides,
})
