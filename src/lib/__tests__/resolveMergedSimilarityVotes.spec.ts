import { describe, expect, it } from 'vitest'
import { resolveMergedSimilarityVotes } from '../resolveMergedSimilarityVotes'
import type { ProductSimilarityVote } from '@/types'

const buildVote = (overrides: Partial<ProductSimilarityVote>): ProductSimilarityVote => ({
  agreed: true,
  created_at: '2026-01-01T00:00:00Z',
  id: 'vote',
  product_id_a: 'a',
  product_id_b: 'b',
  updated_at: '2026-01-01T00:00:00Z',
  user_id: 'user-1',
  ...overrides,
})

describe('resolveMergedSimilarityVotes', () => {
  describe('given a vote between one original product and another product', () => {
    it('repoints it to the merged product in canonical order', () => {
      const vote = buildVote({ product_id_a: 'old-1', product_id_b: 'zzz' })

      const [result] = resolveMergedSimilarityVotes([vote], ['old-1', 'old-2'], 'merged')

      expect([result?.product_id_a, result?.product_id_b]).toEqual(['merged', 'zzz'])
    })
  })

  describe('given a vote between the two original products', () => {
    it('drops it', () => {
      const vote = buildVote({ product_id_a: 'old-1', product_id_b: 'old-2' })

      expect(resolveMergedSimilarityVotes([vote], ['old-1', 'old-2'], 'merged')).toEqual([])
    })
  })

  describe('given one user voting on the same other product from both originals', () => {
    it('keeps the most recently updated vote', () => {
      const votes = [
        buildVote({ id: 'old', product_id_a: 'old-1', product_id_b: 'x' }),
        buildVote({
          id: 'new',
          product_id_a: 'old-2',
          product_id_b: 'x',
          updated_at: '2026-02-01T00:00:00Z',
        }),
      ]

      expect(
        resolveMergedSimilarityVotes(votes, ['old-1', 'old-2'], 'merged').map((v) => v.id),
      ).toEqual(['new'])
    })
  })

  describe('given a negative vote listed before an affirmative vote', () => {
    it('returns affirmative votes first so the cleanup trigger keeps the pair', () => {
      const votes = [
        buildVote({ id: 'negative', agreed: false, user_id: 'user-1', product_id_b: 'x' }),
        buildVote({ id: 'positive', agreed: true, user_id: 'user-2', product_id_b: 'x' }),
      ]

      expect(resolveMergedSimilarityVotes(votes, ['a'], 'merged').map((v) => v.id)).toEqual([
        'positive',
        'negative',
      ])
    })
  })
})
