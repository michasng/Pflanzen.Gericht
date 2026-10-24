import { describe, expect, it } from 'vitest'
import { averageReviewCriteria, type ReviewCriteriaScores } from '../averageReviewCriteria'

const createReview = (overrides: Partial<ReviewCriteriaScores> = {}): ReviewCriteriaScores => ({
  isCurrent: true,
  taste: null,
  consistency: null,
  appearance: null,
  value: null,
  ...overrides,
})

describe('averageReviewCriteria', () => {
  describe('given several current reviews', () => {
    it('averages each criterion with its label', () => {
      const averages = averageReviewCriteria([
        createReview({ taste: 5, value: 2 }),
        createReview({ taste: 3, value: 4 }),
      ])

      expect(averages).toEqual([
        { label: 'Geschmack', value: 4 },
        { label: 'Preis-Leistung', value: 3 },
      ])
    })
  })

  describe('given outdated reviews', () => {
    it('ignores them', () => {
      const averages = averageReviewCriteria([
        createReview({ taste: 5 }),
        createReview({ taste: 1, isCurrent: false }),
      ])

      expect(averages).toEqual([{ label: 'Geschmack', value: 5 }])
    })
  })

  describe('given reviews with missing values', () => {
    it('averages only the values that exist', () => {
      const averages = averageReviewCriteria([
        createReview({ appearance: 4 }),
        createReview({ appearance: null }),
      ])

      expect(averages).toEqual([{ label: 'Aussehen', value: 4 }])
    })
  })

  describe('given no review has any value', () => {
    it('leaves out every criterion', () => {
      expect(averageReviewCriteria([createReview(), createReview()])).toEqual([])
    })
  })

  describe('given no reviews', () => {
    it('returns no averages', () => {
      expect(averageReviewCriteria([])).toEqual([])
    })
  })
})
