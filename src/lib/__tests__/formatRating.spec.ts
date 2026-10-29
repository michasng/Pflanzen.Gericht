import { describe, expect, it } from 'vitest'
import { formatRating } from '../formatRating'

describe('formatRating', () => {
  describe('given a rating score', () => {
    it.each([
      [3.8, '3,8'],
      [4, '4,0'],
      [3.84, '3,8'],
      [3.85, '3,9'],
      [0, '0,0'],
      [5, '5,0'],
    ])('formats %s as %s', (value, expected) => {
      expect(formatRating(value)).toBe(expected)
    })
  })
})
