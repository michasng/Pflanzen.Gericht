import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  BASES,
  BASE_LABELS,
  TAGS,
  TAG_LABELS,
  ALLERGENS,
  ALLERGEN_LABELS,
} from '../taxonomy'

describe('taxonomy labels', () => {
  it('has a German label for every category', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_LABELS[cat], `missing label for category "${cat}"`).toBeTruthy()
    }
  })

  it('has a German label for every base', () => {
    for (const base of BASES) {
      expect(BASE_LABELS[base], `missing label for base "${base}"`).toBeTruthy()
    }
  })

  it('has a German label for every tag', () => {
    for (const tag of TAGS) {
      expect(TAG_LABELS[tag], `missing label for tag "${tag}"`).toBeTruthy()
    }
  })

  it('has a German label for every allergen', () => {
    for (const allergen of ALLERGENS) {
      expect(ALLERGEN_LABELS[allergen], `missing label for allergen "${allergen}"`).toBeTruthy()
    }
  })
})
