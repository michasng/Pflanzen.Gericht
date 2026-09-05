import { describe, expect, it } from 'vitest'
import { hasDuplicateNames } from '../hasDuplicateNames'

describe('hasDuplicateNames', () => {
  describe('given names that differ only by whitespace or case', () => {
    it('returns true', () => {
      expect(hasDuplicateNames([' Fett ', 'fett'])).toBe(true)
    })
  })

  describe('given blank names', () => {
    it('ignores them', () => {
      expect(hasDuplicateNames(['', '  ', 'Protein'])).toBe(false)
    })
  })

  describe('given distinct names', () => {
    it('returns false', () => {
      expect(hasDuplicateNames(['Fett', 'Protein'])).toBe(false)
    })
  })
})
