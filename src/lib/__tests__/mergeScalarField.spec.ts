import { describe, expect, it } from 'vitest'
import { mergeScalarField } from '../mergeScalarField'

describe('mergeScalarField', () => {
  describe('given equal values', () => {
    it.each(['Alpro', 1500, true, false, null, ''])('keeps %j', (value) => {
      expect(mergeScalarField(value, value)).toBe(value)
    })
  })

  describe('given only one side claims a value', () => {
    it.each([
      ['a null', 'Alpro', null],
      ['an empty string', 'Alpro', ''],
      ['false', true, false],
      ['a null number', 1500, null],
    ])('takes the claim over %s in either order', (_label, claim, empty) => {
      expect(mergeScalarField(claim, empty)).toBe(claim)
      expect(mergeScalarField(empty, claim)).toBe(claim)
    })

    it('treats zero as a claim', () => {
      expect(mergeScalarField(0, null)).toBe(0)
    })
  })

  describe('given conflicting claims', () => {
    it.each([
      ['Alpro', 'Provamel'],
      [1500, 1600],
    ])('returns nothing for %j and %j', (a, b) => {
      expect(mergeScalarField(a, b)).toBeUndefined()
    })
  })
})
