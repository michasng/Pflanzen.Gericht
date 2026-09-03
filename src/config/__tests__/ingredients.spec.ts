import { describe, it, expect } from 'vitest'
import {
  INGREDIENT_COMPARATORS,
  isLikelyNonVeganIngredient,
  formatIngredientLabel,
  sortIngredientsByPercentageDesc,
} from '../ingredients'

describe('ingredients config', () => {
  describe('isLikelyNonVeganIngredient', () => {
    it('given a known non-vegan keyword, flags the ingredient', () => {
      expect(isLikelyNonVeganIngredient('Magermilchpulver')).toBe(true)
      expect(isLikelyNonVeganIngredient('Honig')).toBe(true)
    })

    it('given a plant-based ingredient, does not flag it', () => {
      expect(isLikelyNonVeganIngredient('Weizenmehl')).toBe(false)
      expect(isLikelyNonVeganIngredient('Alkohol')).toBe(false)
    })

    it('given an empty name, does not flag it', () => {
      expect(isLikelyNonVeganIngredient('  ')).toBe(false)
    })
  })

  describe('formatIngredientLabel', () => {
    it('given no percentage, shows only the name', () => {
      expect(formatIngredientLabel({ name: 'Wasser', percentage: null, comparator: '=' })).toBe(
        'Wasser',
      )
    })

    it('given the default comparator, omits the comparator symbol', () => {
      expect(formatIngredientLabel({ name: 'Zucker', percentage: 12, comparator: '=' })).toBe(
        'Zucker 12 %',
      )
    })

    it('given a non-default comparator, shows the comparator symbol', () => {
      expect(formatIngredientLabel({ name: 'Alkohol', percentage: 0.5, comparator: '≤' })).toBe(
        'Alkohol ≤ 0.5 %',
      )
    })
  })

  describe('sortIngredientsByPercentageDesc', () => {
    it('given mixed percentages, sorts from highest to lowest with unknowns last', () => {
      const sorted = sortIngredientsByPercentageDesc([
        { name: 'Salz', percentage: null, comparator: '=' },
        { name: 'Wasser', percentage: 60, comparator: '=' },
        { name: 'Zucker', percentage: 12, comparator: '=' },
      ])
      expect(sorted.map((i) => i.name)).toEqual(['Wasser', 'Zucker', 'Salz'])
    })
  })

  it('has a label for every comparator', () => {
    for (const comparator of INGREDIENT_COMPARATORS) {
      expect(comparator).toBeTruthy()
    }
  })
})
