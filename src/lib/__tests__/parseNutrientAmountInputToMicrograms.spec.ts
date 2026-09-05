import { describe, expect, it } from 'vitest'
import { parseNutrientAmountInputToMicrograms } from '../parseNutrientAmountInputToMicrograms'
import { NutrientUnit } from '@/config/nutrients'

describe('parseNutrientAmountInputToMicrograms', () => {
  it('parses German comma notation in grams', () =>
    expect(parseNutrientAmountInputToMicrograms('0,8', NutrientUnit.Gram)).toBe(800_000))
  it('parses dot notation in grams', () =>
    expect(parseNutrientAmountInputToMicrograms('0.8', NutrientUnit.Gram)).toBe(800_000))
  it('parses whole numbers in grams', () =>
    expect(parseNutrientAmountInputToMicrograms('10', NutrientUnit.Gram)).toBe(10_000_000))
  it('parses milligrams', () =>
    expect(parseNutrientAmountInputToMicrograms('50', NutrientUnit.Milligram)).toBe(50_000))
  it('parses micrograms', () =>
    expect(parseNutrientAmountInputToMicrograms('1', NutrientUnit.Microgram)).toBe(1))
  it('rounds to the nearest microgram', () =>
    expect(parseNutrientAmountInputToMicrograms('0.0000001', NutrientUnit.Gram)).toBe(0))
  it('returns null for empty input', () =>
    expect(parseNutrientAmountInputToMicrograms('', NutrientUnit.Gram)).toBeNull())
  it('returns null for text', () =>
    expect(parseNutrientAmountInputToMicrograms('abc', NutrientUnit.Gram)).toBeNull())
  it('returns null for negative values', () =>
    expect(parseNutrientAmountInputToMicrograms('-1', NutrientUnit.Gram)).toBeNull())
})
