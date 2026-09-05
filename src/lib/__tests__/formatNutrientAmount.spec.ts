import { describe, expect, it } from 'vitest'
import { formatNutrientAmount, chooseNutrientDisplayUnit } from '../formatNutrientAmount'
import { NutrientUnit } from '@/config/nutrients'

describe('chooseNutrientDisplayUnit', () => {
  it('chooses grams when the value is at least 0.1 g', () =>
    expect(chooseNutrientDisplayUnit(100_000)).toBe(NutrientUnit.Gram))
  it('chooses milligrams when grams would round below 0.1', () =>
    expect(chooseNutrientDisplayUnit(50_000)).toBe(NutrientUnit.Milligram))
  it('chooses micrograms when milligrams would round below 0.1', () =>
    expect(chooseNutrientDisplayUnit(50)).toBe(NutrientUnit.Microgram))
})

describe('formatNutrientAmount', () => {
  it('formats whole gram values without decimals', () =>
    expect(formatNutrientAmount(10_000_000)).toBe('10 g'))
  it('formats fractional gram values with one digit after the comma', () =>
    expect(formatNutrientAmount(800_000)).toBe('0,8 g'))
  it('formats milligram values', () => expect(formatNutrientAmount(50_000)).toBe('50 mg'))
  it('shows all known digits without losing precision', () =>
    expect(formatNutrientAmount(50_050)).toBe('50,05 mg'))
  it('formats microgram values', () => expect(formatNutrientAmount(1)).toBe('1 µg'))
  it('formats zero as zero micrograms', () => expect(formatNutrientAmount(0)).toBe('0 µg'))
})
