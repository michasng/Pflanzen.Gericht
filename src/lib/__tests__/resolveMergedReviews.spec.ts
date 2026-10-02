import { describe, expect, it } from 'vitest'
import { resolveMergedReviews } from '../resolveMergedReviews'
import type { Review } from '@/types'

const buildReview = (overrides: Partial<Review>): Review => ({
  appearance: null,
  comment: null,
  consistency: null,
  createdAt: '2026-01-01T00:00:00Z',
  id: 'review',
  isCurrent: true,
  nutrition: null,
  overall: 4,
  productId: 'product-a',
  taste: null,
  updatedAt: '2026-01-01T00:00:00Z',
  userId: 'user-1',
  value: null,
  ...overrides,
})

describe('resolveMergedReviews', () => {
  describe('given the same user has a current review on both products', () => {
    it('keeps only the more recent one current and returns both', () => {
      const older = buildReview({ id: 'older', createdAt: '2026-01-01T00:00:00Z' })
      const newer = buildReview({
        id: 'newer',
        productId: 'product-b',
        createdAt: '2026-02-01T00:00:00Z',
      })

      const result = resolveMergedReviews([newer, older])

      expect(result.map(({ id, isCurrent }) => ({ id, isCurrent }))).toEqual([
        { id: 'older', isCurrent: false },
        { id: 'newer', isCurrent: true },
      ])
    })
  })

  describe('given different users with current reviews', () => {
    it('keeps every current flag', () => {
      const result = resolveMergedReviews([
        buildReview({ id: 'a', userId: 'user-1' }),
        buildReview({ id: 'b', userId: 'user-2', productId: 'product-b' }),
      ])

      expect(result.every((review) => review.isCurrent)).toBe(true)
    })
  })

  describe('given a superseded review next to a current one', () => {
    it('leaves the superseded review not current', () => {
      const result = resolveMergedReviews([
        buildReview({ id: 'old', isCurrent: false, createdAt: '2025-01-01T00:00:00Z' }),
        buildReview({ id: 'current' }),
      ])

      expect(result.map((review) => review.isCurrent)).toEqual([false, true])
    })
  })
})
