import { describe, expect, it } from 'vitest'
import { sortNutrientsByHierarchy } from '../sortNutrientsByHierarchy'
import type { NutrientLike } from '@/config/nutrients'

describe('sortNutrientsByHierarchy', () => {
  const make = (name: string): NutrientLike => ({ name, amountMicrograms: 1 })

  it('orders known nutrients by their hierarchy, keeping children after their parent', () => {
    const sorted = sortNutrientsByHierarchy([
      make('Zugesetzter Zucker'),
      make('Salz'),
      make('Kohlenhydrate'),
      make('Zucker'),
      make('Fett'),
      make('Gesättigte Fettsäuren'),
    ])

    expect(sorted.map((nutrient) => nutrient.name)).toEqual([
      'Fett',
      'Gesättigte Fettsäuren',
      'Kohlenhydrate',
      'Zucker',
      'Zugesetzter Zucker',
      'Salz',
    ])
  })

  it('places unknown nutrients after known ones, sorted alphabetically', () => {
    const sorted = sortNutrientsByHierarchy([make('Vitamin C'), make('Calcium'), make('Fett')])

    expect(sorted.map((nutrient) => nutrient.name)).toEqual(['Fett', 'Calcium', 'Vitamin C'])
  })
})
