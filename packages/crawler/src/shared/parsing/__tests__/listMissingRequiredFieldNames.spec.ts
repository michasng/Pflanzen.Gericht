import { describe, expect, it } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import { listMissingRequiredFieldNames } from '../listMissingRequiredFieldNames.js'

describe('listMissingRequiredFieldNames', () => {
  describe('given all fields', () => {
    it('lists nothing', () => {
      expect(
        listMissingRequiredFieldNames({
          brand: 'Alpro',
          quantity: { unit: QuantityUnit.Gram, value: 200 },
        }),
      ).toEqual([])
    })
  })

  describe('given neither brand nor quantity', () => {
    it('lists both', () => {
      expect(listMissingRequiredFieldNames({ brand: null, quantity: null })).toEqual([
        'brand',
        'quantity',
      ])
    })
  })
})
