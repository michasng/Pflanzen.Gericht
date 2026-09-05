import { describe, it, expect } from 'vitest'
import { SORT_OPTIONS, SORT_OPTION_LABELS } from '../sortOptions'

describe('sort option labels', () => {
  it('has a German label for every sort option', () => {
    for (const sortOption of SORT_OPTIONS) {
      expect(
        SORT_OPTION_LABELS[sortOption],
        `missing label for sort option "${sortOption}"`,
      ).toBeTruthy()
    }
  })

  it('uses the natural German wording for low-value sorts', () => {
    expect(SORT_OPTION_LABELS.few_ingredients).toBe('Wenige Zutaten')
    expect(SORT_OPTION_LABELS.calories_asc).toBe('Wenige Kalorien')
    expect(SORT_OPTION_LABELS.saturated_fat_asc).toBe('Wenige gesättigte Fettsäuren')
  })
})
