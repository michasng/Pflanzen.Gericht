import { describe, expect, it } from 'vitest'
import { parsePercentageInput } from '../ingredientPercentage'

describe('ingredientPercentage', () => {
  describe('parsePercentageInput', () => {
    it('given an empty input, returns null', () => {
      expect(parsePercentageInput('')).toBeNull()
      expect(parsePercentageInput('   ')).toBeNull()
    })

    it('given a value with two decimal places, parses it exactly', () => {
      expect(parsePercentageInput('12.34')).toBe(12.34)
    })

    it('given a comma decimal value, parses it exactly', () => {
      expect(parsePercentageInput('12,34')).toBe(12.34)
    })

    it('given a value above 100, clamps it to 100', () => {
      expect(parsePercentageInput('150')).toBe(100)
    })

    it('given a negative value, clamps it to 0', () => {
      expect(parsePercentageInput('-5')).toBe(0)
    })

    it('given a non-numeric input, returns null', () => {
      expect(parsePercentageInput('abc')).toBeNull()
    })
  })
})
