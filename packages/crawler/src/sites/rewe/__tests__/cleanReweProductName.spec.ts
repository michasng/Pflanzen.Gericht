import { describe, expect, it } from 'vitest'
import { cleanReweProductName } from '../cleanReweProductName.js'

describe('cleanReweProductName', () => {
  describe('given a name with brand and vegan postfix', () => {
    it('removes both', () => {
      expect(cleanReweProductName('Alpro Skyr-Alternative Vanille vegan', 'Alpro')).toBe(
        'Skyr-Alternative Vanille',
      )
    })
  })

  describe('given a multipack', () => {
    it('removes brand, vegan postfix and pack size', () => {
      expect(
        cleanReweProductName('Alpro Soja-Dessert Schokolade Mildfein vegan 4x125g', 'Alpro'),
      ).toBe('Soja-Dessert Schokolade Mildfein')
    })
  })

  describe('given a single pack size', () => {
    it('removes brand, vegan postfix and size', () => {
      expect(cleanReweProductName('Alpro Not Mlk Haferdrink 1,8% vegan 1l', 'Alpro')).toBe(
        'Not Mlk Haferdrink 1,8%',
      )
    })
  })

  describe('given a capitalized vegan postfix', () => {
    it('removes it', () => {
      expect(cleanReweProductName('Lekka Pastrami Vegan', null)).toBe('Lekka Pastrami')
    })
  })

  describe('given vegan in the middle of the name', () => {
    it('keeps it', () => {
      expect(cleanReweProductName('Ironmaxx Protein Bar Vegan 30 Schokolade', 'Ironmaxx')).toBe(
        'Protein Bar Vegan 30 Schokolade',
      )
    })
  })
})
