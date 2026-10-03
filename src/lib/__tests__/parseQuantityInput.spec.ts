import { describe, expect, it } from 'vitest'
import { parseQuantityInput } from '../parseQuantityInput'
import { QuantityInputUnit, QuantityUnit } from '@/config/quantity'

describe('parseQuantityInput', () => {
  it('keeps grams, milliliters and pieces', () => {
    expect(parseQuantityInput('500', QuantityInputUnit.Gram)).toEqual({
      unit: QuantityUnit.Gram,
      value: 500,
    })
    expect(parseQuantityInput('330', QuantityInputUnit.Milliliter)).toEqual({
      unit: QuantityUnit.Milliliter,
      value: 330,
    })
    expect(parseQuantityInput('6', QuantityInputUnit.Piece)).toEqual({
      unit: QuantityUnit.Piece,
      value: 6,
    })
  })

  it('converts liters to milliliters', () =>
    expect(parseQuantityInput('1,5', QuantityInputUnit.Liter)).toEqual({
      unit: QuantityUnit.Milliliter,
      value: 1500,
    }))

  it('converts kilograms to grams', () =>
    expect(parseQuantityInput('0.25', QuantityInputUnit.Kilogram)).toEqual({
      unit: QuantityUnit.Gram,
      value: 250,
    }))

  it('accepts the largest database integer quantity', () =>
    expect(parseQuantityInput('2147483647', QuantityInputUnit.Gram)).toEqual({
      unit: QuantityUnit.Gram,
      value: 2147483647,
    }))

  it('returns null when a converted quantity exceeds the database integer limit', () =>
    expect(parseQuantityInput('2147483.648', QuantityInputUnit.Kilogram)).toBeNull())

  it.each(['', 'abc', '0', '-1', '1,5', '0,0001'])('returns null for %j pieces', (input) =>
    expect(parseQuantityInput(input, QuantityInputUnit.Piece)).toBeNull(),
  )

  it('returns null for a liter amount too precise for whole milliliters', () =>
    expect(parseQuantityInput('0,0001', QuantityInputUnit.Liter)).toBeNull())
})
