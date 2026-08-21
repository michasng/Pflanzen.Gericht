import { describe, it, expect } from 'vitest'
import { toErrorMessage } from '../error'

describe('toErrorMessage', () => {
  it('returns message from Error instance', () => {
    expect(toErrorMessage(new Error('oops'))).toBe('oops')
  })

  it('returns message from error-like object', () => {
    expect(toErrorMessage({ message: 'broken' })).toBe('broken')
  })

  it('converts string to itself', () => {
    expect(toErrorMessage('something went wrong')).toBe('something went wrong')
  })

  it('converts number to string', () => {
    expect(toErrorMessage(42)).toBe('42')
  })

  it('converts null to string', () => {
    expect(toErrorMessage(null)).toBe('null')
  })
})
