import { describe, expect, it } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import { parseQuantityFromName } from '../parseQuantityFromName.js'

describe('parseQuantityFromName', () => {
  describe('given a name ending with a size', () => {
    it('parses the last comma-separated segment', () => {
      expect(
        parseQuantityFromName('Alpro Haferdrink This Is Not Milk, ohne Zucker, 3,5% Fett, 1 l'),
      ).toEqual({ unit: QuantityUnit.Milliliter, value: 1000 })
    })
  })

  describe('given a name without a trailing size', () => {
    it('returns null', () => {
      expect(parseQuantityFromName('Alpro Haferdrink')).toBeNull()
    })
  })
})
