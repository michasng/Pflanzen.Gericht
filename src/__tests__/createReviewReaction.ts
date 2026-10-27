import type { ReviewReaction } from '@/types/ReviewReaction'

export const createReviewReaction = (overrides: Partial<ReviewReaction> = {}): ReviewReaction => ({
  emoji: '👍',
  userId: 'user-2',
  profile: { username: 'alex', displayName: null },
  createdAt: '2026-09-11T00:00:00.000Z',
  ...overrides,
})
