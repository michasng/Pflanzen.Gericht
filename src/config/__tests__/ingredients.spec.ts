import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INGREDIENT_COMPARATOR,
  exceedsWholeFraction,
  isLikelyNonVeganIngredient,
  sortIngredientsByFractionDesc,
  sumGuaranteedFractionBasisPoints,
  type IngredientLike,
} from '../ingredients'

describe('isLikelyNonVeganIngredient', () => {
  it('detects known non-vegan keywords regardless of case', () => {
    expect(isLikelyNonVeganIngredient('Vollmilchpulver')).toBe(true)
    expect(isLikelyNonVeganIngredient('honig')).toBe(true)
  })

  it('returns false for plant-based ingredients', () =>
    expect(isLikelyNonVeganIngredient('Hafer')).toBe(false))

  it('returns false for empty input', () => expect(isLikelyNonVeganIngredient('  ')).toBe(false))
})

describe('sortIngredientsByFractionDesc', () => {
  const make = (name: string, fractionBasisPoints: number | null): IngredientLike => ({
    name,
    fractionBasisPoints,
    comparator: DEFAULT_INGREDIENT_COMPARATOR,
  })

  it('orders ingredients from highest to lowest fraction', () => {
    const sorted = sortIngredientsByFractionDesc([make('B', 1000), make('A', 5000)])
    expect(sorted.map((i) => i.name)).toEqual(['A', 'B'])
  })

  it('places ingredients without a fraction last', () => {
    const sorted = sortIngredientsByFractionDesc([make('Unknown', null), make('Known', 100)])
    expect(sorted.map((i) => i.name)).toEqual(['Known', 'Unknown'])
  })
})

describe('sumGuaranteedFractionBasisPoints', () => {
  it('sums fractions with minimum-guaranteed comparators', () => {
    const total = sumGuaranteedFractionBasisPoints([
      { name: 'A', fractionBasisPoints: 6000, comparator: '=' },
      { name: 'B', fractionBasisPoints: 5000, comparator: '≥' },
    ])
    expect(total).toBe(11000)
  })

  it('ignores upper-bound comparators and missing fractions', () => {
    const total = sumGuaranteedFractionBasisPoints([
      { name: 'A', fractionBasisPoints: 9000, comparator: '≤' },
      { name: 'B', fractionBasisPoints: null, comparator: '=' },
    ])
    expect(total).toBe(0)
  })
})

describe('exceedsWholeFraction', () => {
  it('returns false at exactly 100 %', () => expect(exceedsWholeFraction(10000)).toBe(false))
  it('returns true above 100 %', () => expect(exceedsWholeFraction(10001)).toBe(true))
})
