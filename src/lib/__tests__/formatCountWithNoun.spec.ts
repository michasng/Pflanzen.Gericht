import { describe, expect, it } from 'vitest'
import { formatCountWithNoun } from '../formatCountWithNoun'

describe('formatCountWithNoun', () => {
  describe('given a count of one', () => {
    it('uses the singular', () => {
      expect(formatCountWithNoun(1, 'Bewertung', 'Bewertungen')).toBe('1 Bewertung')
    })
  })

  describe('given a count other than one', () => {
    it.each([0, 2])('uses the plural for %i', (count) => {
      expect(formatCountWithNoun(count, 'Bewertung', 'Bewertungen')).toBe(`${count} Bewertungen`)
    })
  })
})
