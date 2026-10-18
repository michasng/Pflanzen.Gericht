import type { ReviewWithDetails } from '@/services/reviews'

export const createReviewWithDetails = (
  overrides: Partial<ReviewWithDetails> = {},
): ReviewWithDetails => ({
  id: 'review-1',
  productId: 'product-1',
  userId: 'user-1',
  overall: 4,
  taste: null,
  consistency: null,
  appearance: null,
  nutrition: null,
  value: null,
  comment: null,
  isCurrent: true,
  createdAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
  tags: [],
  images: [],
  ...overrides,
})
