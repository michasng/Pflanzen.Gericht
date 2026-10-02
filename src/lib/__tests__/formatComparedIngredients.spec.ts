import { describe, expect, it } from 'vitest'
import { formatComparedIngredients } from '../formatComparedIngredients'
import { EMPTY_COMPARED_VALUE } from '../formatComparedFieldValue'

describe('formatComparedIngredients', () => {
  describe('given no ingredients', () => {
    it('returns the empty placeholder', () => {
      expect(formatComparedIngredients([])).toBe(EMPTY_COMPARED_VALUE)
    })
  })

  describe('given ingredients', () => {
    it('lists each on its own line', () => {
      const result = formatComparedIngredients([
        { name: 'Hafer', fractionBasisPoints: 1000, comparator: '=' },
        { name: 'Salz', fractionBasisPoints: null, comparator: '=' },
      ])

      expect(result).toBe('Hafer 10 %\nSalz')
    })
  })
})
