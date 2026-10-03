import { describe, expect, it } from 'vitest'
import { formatQuantity } from '../formatQuantity'
import { QuantityUnit } from '@/config/quantity'

describe('formatQuantity', () => {
  it.each([
    [QuantityUnit.Milliliter, 1000, '1 l'],
    [QuantityUnit.Milliliter, 1500, '1,5 l'],
    [QuantityUnit.Milliliter, 330, '330 ml'],
    [QuantityUnit.Gram, 500, '500 g'],
    [QuantityUnit.Gram, 2000, '2 kg'],
    [QuantityUnit.Piece, 6, '6 Stück'],
    [QuantityUnit.Piece, 1000, '1.000 Stück'],
  ])('formats %s %i as %s', (unit, value, expected) =>
    expect(formatQuantity({ unit, value })).toBe(expected),
  )
})
