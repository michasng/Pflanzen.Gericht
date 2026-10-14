import { describe, expect, it } from 'vitest'
import { convertGramsToMicrograms } from '../convertGramsToMicrograms.js'

describe('convertGramsToMicrograms', () => {
  describe('given grams whose multiplication is imprecise', () => {
    it('returns whole micrograms', () => {
      expect(convertGramsToMicrograms(8.3)).toBe(8_300_000)
    })
  })
})
