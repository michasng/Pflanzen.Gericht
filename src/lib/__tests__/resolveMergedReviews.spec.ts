import { describe, expect, it } from 'vitest'
import { resolveMergedReviews } from '../resolveMergedReviews'
import type { Review } from '@/types'

const buildReview = (overrides: Partial<Review>): Review => ({
  appearance: null,
  comment: null,
  consistency: null,
  created_at: '2026-01-01T00:00:00Z',
  id: 'review',
  is_current: true,
  nutrition: null,
  overall: 4,
  product_id: 'product-a',
  taste: null,
  updated_at: '2026-01-01T00:00:00Z',
  user_id: 'user-1',
  value: null,
  ...overrides,
})

describe('resolveMergedReviews', () => {
  describe('given the same user has a current review on both products', () => {
    it('keeps only the more recent one current and returns both', () => {
      const older = buildReview({ id: 'older', created_at: '2026-01-01T00:00:00Z' })
      const newer = buildReview({
        id: 'newer',
        product_id: 'product-b',
        created_at: '2026-02-01T00:00:00Z',
      })

      const result = resolveMergedReviews([newer, older])

      expect(result.map(({ id, is_current }) => ({ id, is_current }))).toEqual([
        { id: 'older', is_current: false },
        { id: 'newer', is_current: true },
      ])
    })
  })

  describe('given different users with current reviews', () => {
    it('keeps every current flag', () => {
      const result = resolveMergedReviews([
        buildReview({ id: 'a', user_id: 'user-1' }),
        buildReview({ id: 'b', user_id: 'user-2', product_id: 'product-b' }),
      ])

      expect(result.every((review) => review.is_current)).toBe(true)
    })
  })

  describe('given a superseded review next to a current one', () => {
    it('leaves the superseded review not current', () => {
      const result = resolveMergedReviews([
        buildReview({ id: 'old', is_current: false, created_at: '2025-01-01T00:00:00Z' }),
        buildReview({ id: 'current' }),
      ])

      expect(result.map((review) => review.is_current)).toEqual([false, true])
    })
  })
})
