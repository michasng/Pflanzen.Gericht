import { describe, expect, it } from 'vitest'
import { selectProductUrls } from '../selectProductUrls.js'

const URLS = ['a', 'b', 'c', 'd', 'e']
const NO_EXCLUDED_URLS: ReadonlySet<string> = new Set()

describe('selectProductUrls', () => {
  describe('given no skip and no limit', () => {
    it('returns all urls', () => {
      expect(
        selectProductUrls(URLS, { skip: 0, limit: null, excludedProductUrls: NO_EXCLUDED_URLS }),
      ).toEqual(URLS)
    })
  })

  describe('given a limit', () => {
    it('returns the first urls', () => {
      expect(
        selectProductUrls(URLS, { skip: 0, limit: 2, excludedProductUrls: NO_EXCLUDED_URLS }),
      ).toEqual(['a', 'b'])
    })
  })

  describe('given a skip', () => {
    it('omits the first urls', () => {
      expect(
        selectProductUrls(URLS, { skip: 2, limit: null, excludedProductUrls: NO_EXCLUDED_URLS }),
      ).toEqual(['c', 'd', 'e'])
    })
  })

  describe('given a skip and a limit', () => {
    it('returns the limit after the skipped urls', () => {
      expect(
        selectProductUrls(URLS, { skip: 1, limit: 2, excludedProductUrls: NO_EXCLUDED_URLS }),
      ).toEqual(['b', 'c'])
    })
  })

  describe('given already crawled urls', () => {
    it('fills the limit with urls that were not crawled yet', () => {
      expect(
        selectProductUrls(URLS, { skip: 1, limit: 2, excludedProductUrls: new Set(['a', 'c']) }),
      ).toEqual(['b', 'd'])
    })
  })
})
