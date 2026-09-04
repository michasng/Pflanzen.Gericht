import { describe, expect, it } from 'vitest'
import { isLikelyNonVeganIngredient } from '../isLikelyNonVeganIngredient'

describe('isLikelyNonVeganIngredient', () => {
  it('detects known non-vegan keywords regardless of case', () => {
    expect(isLikelyNonVeganIngredient('Vollmilchpulver')).toBe(true)
    expect(isLikelyNonVeganIngredient('honig')).toBe(true)
  })

  it('returns false for plant-based ingredients', () =>
    expect(isLikelyNonVeganIngredient('Hafer')).toBe(false))

  it('returns false for empty input', () => expect(isLikelyNonVeganIngredient('  ')).toBe(false))
})
