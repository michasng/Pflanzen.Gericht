import { afterEach, describe, expect, it, vi } from 'vitest'
import { NUTRIENT_PARENT_NAME } from '@/config/nutrientHierarchy'
import { getNutrientHierarchyDepth } from '../getNutrientHierarchyDepth'

describe('getNutrientHierarchyDepth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('given the nutrient hierarchy contains a cycle, stops at the repeated parent', () => {
    const cyclicParentNames = new Map([
      ['Cycle A', 'Cycle B'],
      ['Cycle B', 'Cycle A'],
    ])

    vi.spyOn(NUTRIENT_PARENT_NAME, 'get').mockImplementation((name: string) =>
      cyclicParentNames.get(name),
    )

    expect(getNutrientHierarchyDepth('Cycle A')).toBe(1)
  })
})
