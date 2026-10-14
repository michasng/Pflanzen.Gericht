import { describe, expect, it } from 'vitest'
import { convertKilojoulesToJoules } from '../convertKilojoulesToJoules.js'

describe('convertKilojoulesToJoules', () => {
  describe('given kilojoules whose multiplication is imprecise', () => {
    it('returns whole joules', () => {
      expect(convertKilojoulesToJoules(1.005)).toBe(1005)
    })
  })

  describe('given no kilojoules', () => {
    it('returns null', () => {
      expect(convertKilojoulesToJoules(null)).toBeNull()
    })
  })
})
