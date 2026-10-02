import { describe, expect, it } from 'vitest'
import { mergeIngredientsByName } from '../mergeIngredientsByName'

describe('mergeIngredientsByName', () => {
  describe('given the same ingredient with equal values', () => {
    it('keeps its value', () => {
      const ingredient = { name: 'Hafer', fractionBasisPoints: 1000, comparator: '=' } as const

      expect(mergeIngredientsByName([ingredient], [ingredient])).toEqual([ingredient])
    })
  })

  describe('given the same ingredient with different values', () => {
    it('keeps the ingredient but omits its value', () => {
      const result = mergeIngredientsByName(
        [{ name: 'Hafer', fractionBasisPoints: 1000, comparator: '=' }],
        [{ name: 'hafer', fractionBasisPoints: 2000, comparator: '=' }],
      )

      expect(result).toEqual([{ name: 'Hafer', fractionBasisPoints: null, comparator: '=' }])
    })
  })

  describe('given the same ingredient where only one product knows the amount', () => {
    it.each([
      ['first', 1000, null],
      ['second', null, 1000],
    ])('takes the amount from the %s product', (_label, firstAmount, secondAmount) => {
      const result = mergeIngredientsByName(
        [{ name: 'Hafer', fractionBasisPoints: firstAmount, comparator: '<' }],
        [{ name: 'hafer', fractionBasisPoints: secondAmount, comparator: '<' }],
      )

      expect(result).toEqual([{ name: 'Hafer', fractionBasisPoints: 1000, comparator: '<' }])
    })
  })

  describe('given ingredients unique to one product', () => {
    it('includes both', () => {
      const result = mergeIngredientsByName(
        [{ name: 'Hafer', fractionBasisPoints: 1000, comparator: '=' }],
        [{ name: 'Salz', fractionBasisPoints: null, comparator: '=' }],
      )

      expect(result.map((ingredient) => ingredient.name)).toEqual(['Hafer', 'Salz'])
    })
  })
})
