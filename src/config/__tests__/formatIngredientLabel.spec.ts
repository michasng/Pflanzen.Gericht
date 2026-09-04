import { describe, expect, it } from 'vitest'
import { DEFAULT_INGREDIENT_COMPARATOR } from '../ingredients'
import { formatIngredientLabel } from '../formatIngredientLabel'

describe('formatIngredientLabel', () => {
  it('returns the plain name when no fraction is set', () =>
    expect(
      formatIngredientLabel({
        name: 'Hafer',
        fractionBasisPoints: null,
        comparator: DEFAULT_INGREDIENT_COMPARATOR,
      }),
    ).toBe('Hafer'))

  it('omits the comparator symbol for the default "="', () =>
    expect(
      formatIngredientLabel({ name: 'Hafer', fractionBasisPoints: 4000, comparator: '=' }),
    ).toBe('Hafer 40 %'))

  it('formats a non-default comparator like the packaging example', () =>
    expect(
      formatIngredientLabel({ name: 'Alkohol', fractionBasisPoints: 50, comparator: '≤' }),
    ).toBe('Alkohol ≤ 0,5 %'))
})
