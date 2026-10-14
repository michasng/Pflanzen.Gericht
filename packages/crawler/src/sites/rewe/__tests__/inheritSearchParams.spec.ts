import { describe, expect, it } from 'vitest'
import { inheritSearchParams } from '../inheritSearchParams.js'

describe('inheritSearchParams', () => {
  describe('given a source with a filter the target lacks', () => {
    it('adds the filter to the target', () => {
      expect(inheritSearchParams('https://x/b/', 'https://x/a/?attribute=vegan')).toBe(
        'https://x/b/?attribute=vegan',
      )
    })
  })

  describe('given a target that already sets the same parameter', () => {
    it('keeps the target value', () => {
      expect(
        inheritSearchParams('https://x/b/?attribute=bio', 'https://x/a/?attribute=vegan'),
      ).toBe('https://x/b/?attribute=bio')
    })
  })

  describe('given a source without parameters', () => {
    it('returns the target unchanged', () => {
      expect(inheritSearchParams('https://x/b/?page=2', 'https://x/a/')).toBe('https://x/b/?page=2')
    })
  })
})
