import { describe, expect, it } from 'vitest'
import { parseEuroCents } from '../parseEuroCents.js'

describe('parseEuroCents', () => {
  describe('given a euro amount', () => {
    it('returns rounded cents', () => {
      expect(parseEuroCents('2.29')).toBe(229)
    })
  })

  describe('given no amount', () => {
    it('returns zero', () => {
      expect(parseEuroCents(null)).toBe(0)
    })
  })

  describe('given text that is not a number', () => {
    it('returns zero', () => {
      expect(parseEuroCents('free')).toBe(0)
    })
  })
})
