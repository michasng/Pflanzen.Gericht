import { describe, expect, it } from 'vitest'
import { isHttpUrlString } from '../isHttpUrlString'

describe('isHttpUrlString', () => {
  describe('given an http or https url', () => {
    it('returns true', () => {
      expect(isHttpUrlString('https://rewe.de/shop')).toBe(true)
      expect(isHttpUrlString('http://rewe.de')).toBe(true)
    })
  })

  describe('given a non-http url', () => {
    it('returns false', () => {
      expect(isHttpUrlString('javascript:alert(1)')).toBe(false)
      expect(isHttpUrlString('ftp://rewe.de')).toBe(false)
    })
  })

  describe('given text that is not a url', () => {
    it('returns false', () => {
      expect(isHttpUrlString('rewe')).toBe(false)
    })
  })
})
