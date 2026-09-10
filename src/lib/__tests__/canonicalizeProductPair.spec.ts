import { describe, expect, it } from 'vitest'
import { canonicalizeProductPair } from '@/lib/canonicalizeProductPair'

describe('canonicalizeProductPair', () => {
  describe('given the ids are already sorted', () => {
    it('returns them unchanged', () => {
      expect(canonicalizeProductPair('1111', '2222')).toEqual(['1111', '2222'])
    })
  })

  describe('given the ids are reversed', () => {
    it('returns them in ascending order', () => {
      expect(canonicalizeProductPair('2222', '1111')).toEqual(['1111', '2222'])
    })
  })

  describe('given both ids are the same', () => {
    it('returns the same pair', () => {
      expect(canonicalizeProductPair('1111', '1111')).toEqual(['1111', '1111'])
    })
  })
})
