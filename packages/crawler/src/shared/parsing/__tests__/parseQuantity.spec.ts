import { describe, expect, it } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import { parseQuantity } from '../parseQuantity.js'

describe('parseQuantity', () => {
  describe('given a size in grams', () => {
    it('returns grams', () => {
      expect(parseQuantity('90 g')).toEqual({ unit: QuantityUnit.Gram, value: 90 })
    })

    it('given no space and non-breaking whitespace around, still parses', () => {
      expect(parseQuantity('\u00a0400g ')).toEqual({ unit: QuantityUnit.Gram, value: 400 })
    })
  })

  describe('given a size in kilograms', () => {
    it('converts to grams', () => {
      expect(parseQuantity('1,5 kg')).toEqual({ unit: QuantityUnit.Gram, value: 1500 })
    })
  })

  describe('given a size in liters', () => {
    it('converts decimals with comma to whole milliliters', () => {
      expect(parseQuantity('1,5 l')).toEqual({ unit: QuantityUnit.Milliliter, value: 1500 })
    })

    it('given a floating point artifact, still returns a whole number', () => {
      expect(parseQuantity('1.1 l')).toEqual({ unit: QuantityUnit.Milliliter, value: 1100 })
    })
  })

  describe('given a size in milliliters', () => {
    it('returns milliliters', () => {
      expect(parseQuantity('250 ml')).toEqual({ unit: QuantityUnit.Milliliter, value: 250 })
    })
  })

  describe('given a piece count', () => {
    it.each(['6 Stück', '6 Stk.', '6 St'])('parses "%s"', (text) => {
      expect(parseQuantity(text)).toEqual({ unit: QuantityUnit.Piece, value: 6 })
    })
  })

  describe('given text that is not a single size', () => {
    it.each(['6 x 200 g', '12er', 'ca. 200 g', '', 'Bio', '0 g', '0,5 g'])(
      'returns null for "%s"',
      (text) => {
        expect(parseQuantity(text)).toBeNull()
      },
    )
  })
})
