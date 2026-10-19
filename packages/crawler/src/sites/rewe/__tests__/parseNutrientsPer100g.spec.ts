import { describe, expect, it } from 'vitest'
import { parseNutrientsPer100g } from '../parseNutrientsPer100g.js'
import type { ReweNutritionFacts } from '../reweNutritionFacts.js'

const buildNutritionFacts = (servingSizeUom: string): ReweNutritionFacts => ({
  servingSize: { value: 100, uom: servingSizeUom },
  nutrientInformation: [
    { nutrientType: { code: 'ENER-' }, quantityContained: { value: 176, uom: 'KJO' } },
    { nutrientType: { code: 'ENER-' }, quantityContained: { value: 42, uom: 'E14' } },
    { nutrientType: { code: 'FAT' }, quantityContained: { value: 1.4, uom: 'GR' } },
    { nutrientType: { code: 'UNKNOWN' }, quantityContained: { value: 9, uom: 'GR' } },
  ],
})

const expectedNutrition = { energyKilojoules: 176, nutrientsPer100g: { Fett: 1.4 } }

describe('parseNutrientsPer100g', () => {
  describe('given facts per 100 grams', () => {
    it('returns the kilojoules and known nutrients', () => {
      expect(parseNutrientsPer100g([buildNutritionFacts('GR')])).toEqual(expectedNutrition)
    })
  })

  describe('given facts per 100 milliliters', () => {
    it('returns the kilojoules and known nutrients', () => {
      expect(parseNutrientsPer100g([buildNutritionFacts('ML')])).toEqual(expectedNutrition)
    })
  })

  describe('given facts per another unit', () => {
    it('returns empty nutrition', () => {
      expect(parseNutrientsPer100g([buildNutritionFacts('PIECE')])).toEqual({
        energyKilojoules: null,
        nutrientsPer100g: {},
      })
    })
  })
})
