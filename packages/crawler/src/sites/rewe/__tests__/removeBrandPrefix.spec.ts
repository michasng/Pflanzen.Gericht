import { describe, expect, it } from 'vitest'
import { removeBrandPrefix } from '../removeBrandPrefix.js'

describe('removeBrandPrefix', () => {
  describe('given a name starting with the brand', () => {
    it('removes the brand', () => {
      expect(removeBrandPrefix('Alpro Skyr-Alternative Vanille', 'Alpro')).toBe(
        'Skyr-Alternative Vanille',
      )
    })
  })

  describe('given a multi-word brand', () => {
    it('removes all brand words', () => {
      expect(removeBrandPrefix('REWE Beste Wahl Hummus', 'REWE Beste Wahl')).toBe('Hummus')
    })
  })

  describe('given the brand spelled with different casing, spacing or diacritics', () => {
    it('removes the brand', () => {
      expect(removeBrandPrefix('MushRoots Pilz-Hack', 'Mush Roots')).toBe('Pilz-Hack')
      expect(removeBrandPrefix('Knack & Back Croissants', 'Knack&Back')).toBe('Croissants')
      expect(removeBrandPrefix('Rügenwälder Mühle Hack', 'Rügenwalder Mühle')).toBe('Hack')
      expect(removeBrandPrefix('Toni M No Tuna', 'Toni M.')).toBe('No Tuna')
    })
  })

  describe('given the brand only as part of the first word', () => {
    it('keeps the name unchanged', () => {
      expect(removeBrandPrefix('Alsan-S Reform-Margarine', 'Alsan')).toBe(
        'Alsan-S Reform-Margarine',
      )
    })
  })

  describe('given a name not starting with the brand', () => {
    it('keeps the name unchanged', () => {
      expect(removeBrandPrefix('Like Chicken Burger', 'LikeMeat')).toBe('Like Chicken Burger')
    })
  })

  describe('given a name consisting only of the brand', () => {
    it('keeps the name unchanged', () => {
      expect(removeBrandPrefix('Oreo', 'Oreo')).toBe('Oreo')
    })
  })

  describe('given no brand', () => {
    it('keeps the name unchanged', () => {
      expect(removeBrandPrefix('Lekka Pastrami', null)).toBe('Lekka Pastrami')
    })
  })
})
