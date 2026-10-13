import { describe, expect, it } from 'vitest'
import { tryProbe } from '../tryProbe.js'

describe('tryProbe', () => {
  describe('given the probe succeeds', () => {
    it('returns null', async () => {
      expect(await tryProbe(async () => ({ error: null }))).toBeNull()
    })
  })

  describe('given the probe resolves with an error', () => {
    it('returns the error message', async () => {
      const probe = async () => ({ error: { message: 'fetch failed' } })

      expect(await tryProbe(probe)).toBe('fetch failed')
    })
  })

  describe('given the probe throws', () => {
    it('returns the thrown message', async () => {
      const probe = async () => {
        throw new Error('ECONNREFUSED')
      }

      expect(await tryProbe(probe)).toBe('ECONNREFUSED')
    })
  })
})
