import { describe, expect, it } from 'vitest'
import { formatComparedNutrients } from '../formatComparedNutrients'
import { EMPTY_COMPARED_VALUE } from '../formatComparedFieldValue'

describe('formatComparedNutrients', () => {
  describe('given no nutrients', () => {
    it('returns the empty placeholder', () => {
      expect(formatComparedNutrients([])).toBe(EMPTY_COMPARED_VALUE)
    })
  })

  describe('given nutrients', () => {
    it('lists each with its amount on its own line', () => {
      const result = formatComparedNutrients([
        { name: 'Protein', amountMicrograms: 3_000_000 },
        { name: 'Salz', amountMicrograms: 50_000 },
      ])

      expect(result).toBe('Protein 3 g\nSalz 50 mg')
    })
  })
})
