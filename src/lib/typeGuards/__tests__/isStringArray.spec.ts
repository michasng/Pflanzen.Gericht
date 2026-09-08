import { describe, it, expect } from 'vitest'
import { isStringArray } from '../isStringArray'

describe('isStringArray', () => {
  it('given an array of strings, returns true', () => {
    expect(isStringArray(['a', 'b'])).toBe(true)
  })

  it('given a mixed array, returns false', () => {
    expect(isStringArray(['a', 1])).toBe(false)
  })

  it('given a non-array, returns false', () => {
    expect(isStringArray('a')).toBe(false)
  })
})
