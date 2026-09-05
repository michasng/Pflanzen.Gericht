import { describe, expect, it } from 'vitest'
import { DEFAULT_INGREDIENT_COMPARATOR, type IngredientLike } from '../ingredients'
import { sortIngredientsByFractionDesc } from '../sortIngredientsByFractionDesc'

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
