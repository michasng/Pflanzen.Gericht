import { describe, expect, it } from 'vitest'
import { mergeAllergens } from '../mergeAllergens'

describe('mergeAllergens', () => {
  describe('given overlapping allergens', () => {
    it('returns each allergen once', () => {
      expect(mergeAllergens(['soy', 'gluten'], ['soy', 'nuts'])).toEqual(['soy', 'gluten', 'nuts'])
    })
  })

  describe('given no allergens', () => {
    it('returns an empty list', () => {
      expect(mergeAllergens([], [])).toEqual([])
    })
  })
})
