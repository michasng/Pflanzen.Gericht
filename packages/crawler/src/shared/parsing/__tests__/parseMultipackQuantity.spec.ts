import { describe, expect, it } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import { parseMultipackQuantity } from '../parseMultipackQuantity.js'

describe('parseMultipackQuantity', () => {
  describe('given a single size', () => {
    it('parses it like a plain quantity', () => {
      expect(parseMultipackQuantity('400g')).toEqual({ unit: QuantityUnit.Gram, value: 400 })
    })
  })

  describe('given a multipack', () => {
    it('multiplies the pack size by the pack count', () => {
      expect(parseMultipackQuantity('2x100g')).toEqual({ unit: QuantityUnit.Gram, value: 200 })
    })

    it('given spaces and an uppercase x, still multiplies', () => {
      expect(parseMultipackQuantity('6 X 0,5 l')).toEqual({
        unit: QuantityUnit.Milliliter,
        value: 3000,
      })
    })

    it('given an unparseable pack size, returns null', () => {
      expect(parseMultipackQuantity('2x foo')).toBeNull()
    })
  })
})
