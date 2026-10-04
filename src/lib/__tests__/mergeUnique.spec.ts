import { describe, expect, it } from 'vitest'
import { mergeUnique } from '../mergeUnique'

describe('mergeUnique', () => {
  describe('given overlapping values', () => {
    it('returns each value once', () => {
      expect(mergeUnique(['soy', 'gluten'], ['soy', 'nuts'])).toEqual(['soy', 'gluten', 'nuts'])
    })
  })

  describe('given no values', () => {
    it('returns an empty list', () => {
      expect(mergeUnique([], [])).toEqual([])
    })
  })
})
