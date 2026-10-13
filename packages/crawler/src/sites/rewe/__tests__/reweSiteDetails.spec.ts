import { describe, expect, it } from 'vitest'
import { isReweSiteDetails } from '../reweSiteDetails.js'

describe('isReweSiteDetails', () => {
  describe('given a string category slug', () => {
    it('accepts it', () => {
      expect(isReweSiteDetails({ categorySlug: 'tofu' })).toBe(true)
    })
  })

  describe('given a null category slug', () => {
    it('accepts it', () => {
      expect(isReweSiteDetails({ categorySlug: null })).toBe(true)
    })
  })

  describe('given something else', () => {
    it.each([[null], [undefined], ['tofu'], [{}], [{ categorySlug: 3 }]])('rejects %j', (value) => {
      expect(isReweSiteDetails(value)).toBe(false)
    })
  })
})
