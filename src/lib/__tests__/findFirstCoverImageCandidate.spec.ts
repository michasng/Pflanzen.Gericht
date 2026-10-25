import { describe, expect, it } from 'vitest'
import { findFirstCoverImageCandidate } from '@/lib/findFirstCoverImageCandidate'

describe('findFirstCoverImageCandidate', () => {
  describe('given unordered images', () => {
    it('returns the one with the lowest sort order without reordering the input', () => {
      const images = [
        { storagePath: 'second', sortOrder: 1 },
        { storagePath: 'first', sortOrder: 0 },
      ]

      expect(findFirstCoverImageCandidate(images)?.storagePath).toBe('first')
      expect(images.map((image) => image.storagePath)).toEqual(['second', 'first'])
    })
  })

  describe('given no images', () => {
    it('returns nothing', () => {
      expect(findFirstCoverImageCandidate([])).toBeUndefined()
    })
  })
})
