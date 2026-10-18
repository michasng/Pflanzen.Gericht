import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MISMATCH_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
  validateNewPassword,
} from '../validateNewPassword'

describe('validateNewPassword', () => {
  describe('given the passwords differ', () => {
    it('returns the mismatch message', () => {
      expect(validateNewPassword('a'.repeat(PASSWORD_MIN_LENGTH), 'b')).toBe(
        PASSWORD_MISMATCH_MESSAGE,
      )
    })
  })

  describe('given matching passwords shorter than the minimum', () => {
    it('returns the too-short message', () => {
      const tooShort = 'a'.repeat(PASSWORD_MIN_LENGTH - 1)

      expect(validateNewPassword(tooShort, tooShort)).toBe(PASSWORD_TOO_SHORT_MESSAGE)
    })
  })

  describe('given matching passwords of the minimum length', () => {
    it('returns nothing', () => {
      const valid = 'a'.repeat(PASSWORD_MIN_LENGTH)

      expect(validateNewPassword(valid, valid)).toBeUndefined()
    })
  })
})
