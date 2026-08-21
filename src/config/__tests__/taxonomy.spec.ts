import { describe, it, expect } from 'vitest'
import { CATEGORIES, CATEGORY_LABELS, BASES, BASE_LABELS, TAGS, TAG_LABELS } from '../taxonomy'

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

  it('category label count matches category count', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(CATEGORIES.length)
  })

  it('base label count matches base count', () => {
    expect(Object.keys(BASE_LABELS)).toHaveLength(BASES.length)
  })

  it('tag label count matches tag count', () => {
    expect(Object.keys(TAG_LABELS)).toHaveLength(TAGS.length)
  })
})
