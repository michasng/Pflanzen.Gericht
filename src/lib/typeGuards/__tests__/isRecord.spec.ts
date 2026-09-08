import { describe, it, expect } from 'vitest'
import { isRecord } from '../isRecord'

describe('isRecord', () => {
  it('given an object, returns true', () => {
    expect(isRecord({ key: 'value' })).toBe(true)
  })

  it('given null, returns false', () => {
    expect(isRecord(null)).toBe(false)
  })

  it('given a primitive, returns false', () => {
    expect(isRecord('text')).toBe(false)
  })
})
