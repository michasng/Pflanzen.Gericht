import { describe, expect, it } from 'vitest'
import { isEmptyComparableValue } from '../isEmptyComparableValue.js'

describe('isEmptyComparableValue', () => {
  describe.each([
    { description: 'null', value: null },
    { description: 'an empty text', value: '' },
    { description: 'an empty list', value: [] },
    { description: 'an empty record', value: {} },
  ])('given $description', ({ value }) => {
    it('returns true', () => {
      expect(isEmptyComparableValue(value)).toBe(true)
    })
  })

  describe.each([
    { description: 'a text', value: 'Tofu' },
    { description: 'zero', value: 0 },
    { description: 'false', value: false },
    { description: 'a filled list', value: ['soy'] },
    { description: 'a filled record', value: { Fett: 5 } },
  ])('given $description', ({ value }) => {
    it('returns false', () => {
      expect(isEmptyComparableValue(value)).toBe(false)
    })
  })
})
