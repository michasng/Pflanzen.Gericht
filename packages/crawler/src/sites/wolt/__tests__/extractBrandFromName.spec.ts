import { describe, expect, it } from 'vitest'
import { extractBrandFromName } from '../extractBrandFromName.js'

describe('extractBrandFromName', () => {
  describe('given a name starting with a known multi-word brand', () => {
    it('extracts the whole brand and removes it from the name', () => {
      expect(extractBrandFromName('Billie Green Salami Klassik vegan, 70 g')).toEqual({
        brand: 'Billie Green',
        nameWithoutBrand: 'Salami Klassik vegan, 70 g',
      })
    })

    it('given different casing, keeps the casing of the name', () => {
      expect(extractBrandFromName('rügenwalder mühle Vegane Mortadella')).toEqual({
        brand: 'rügenwalder mühle',
        nameWithoutBrand: 'Vegane Mortadella',
      })
    })
  })

  describe('given a name starting with an unknown brand', () => {
    it('uses the first word as brand', () => {
      expect(extractBrandFromName('Alpro Haferdrink, 1 l')).toEqual({
        brand: 'Alpro',
        nameWithoutBrand: 'Haferdrink, 1 l',
      })
    })
  })

  describe('given a known brand that is only a prefix of the first word', () => {
    it('falls back to the first word', () => {
      expect(extractBrandFromName('Like Meatballs, 200 g')?.brand).toBe('Like')
    })
  })

  describe('given a separator after the brand', () => {
    it('removes the separator from the name', () => {
      expect(extractBrandFromName('Oatly - Haferdrink, 1 l')).toEqual({
        brand: 'Oatly',
        nameWithoutBrand: 'Haferdrink, 1 l',
      })
    })
  })

  describe('given an empty name', () => {
    it('returns null', () => {
      expect(extractBrandFromName('  ')).toBeNull()
    })
  })
})
