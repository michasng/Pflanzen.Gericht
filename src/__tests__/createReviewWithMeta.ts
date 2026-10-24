import type { ReviewWithMeta } from '@/services/profile'

export const createReviewWithMeta = (overrides: Partial<ReviewWithMeta> = {}): ReviewWithMeta => ({
  id: 'review-1',
  productId: 'product-1',
  userId: 'user-1',
  overall: 4,
  taste: null,
  consistency: null,
  appearance: null,
  value: null,
  comment: null,
  isCurrent: true,
  createdAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
  product: { id: 'product-1', name: 'Hafermilch', category: 'milk' },
  tags: [],
  ...overrides,
})
