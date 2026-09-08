import { describe, expect, it } from 'vitest'
import { getNutrientHierarchyDepth } from '../getNutrientHierarchyDepth'

describe('getNutrientHierarchyDepth', () => {
  it('given a top-level nutrient, returns a depth of 0', () => {
    expect(getNutrientHierarchyDepth('Fett')).toBe(0)
  })

  it('given a nutrient included in another, returns a depth of 1', () => {
    expect(getNutrientHierarchyDepth('Zucker')).toBe(1)
  })

  it('given a nutrient included in two others, returns a depth of 2', () => {
    expect(getNutrientHierarchyDepth('Zugesetzter Zucker')).toBe(2)
  })

  it('given an unknown nutrient, returns a depth of 0', () => {
    expect(getNutrientHierarchyDepth('Calcium')).toBe(0)
  })
})
