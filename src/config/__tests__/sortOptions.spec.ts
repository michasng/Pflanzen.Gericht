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
})
