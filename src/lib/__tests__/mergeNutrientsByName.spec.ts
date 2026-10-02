import { describe, expect, it } from 'vitest'
import { mergeNutrientsByName } from '../mergeNutrientsByName'

describe('mergeNutrientsByName', () => {
  describe('given the same nutrient with equal amounts', () => {
    it('keeps its amount', () => {
      const nutrient = { name: 'Protein', amountMicrograms: 3_000_000 }

      expect(mergeNutrientsByName([nutrient], [nutrient])).toEqual([nutrient])
    })
  })

  describe('given the same nutrient with different amounts', () => {
    it('keeps the nutrient but omits its amount', () => {
      const result = mergeNutrientsByName(
        [{ name: 'Protein', amountMicrograms: 3_000_000 }],
        [{ name: 'protein', amountMicrograms: 4_000_000 }],
      )

      expect(result).toEqual([{ name: 'Protein', amountMicrograms: null }])
    })
  })

  describe('given nutrients unique to one product', () => {
    it('includes both', () => {
      const result = mergeNutrientsByName(
        [{ name: 'Protein', amountMicrograms: 3_000_000 }],
        [{ name: 'Salz', amountMicrograms: 50_000 }],
      )

      expect(result.map((nutrient) => nutrient.name)).toEqual(['Protein', 'Salz'])
    })
  })
})
