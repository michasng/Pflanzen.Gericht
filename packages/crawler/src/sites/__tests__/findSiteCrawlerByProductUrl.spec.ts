import { describe, expect, it } from 'vitest'
import { findSiteCrawlerByProductUrl } from '../index.js'
import type { SiteCrawler } from '../types.js'

const createCrawlerStub = (id: SiteCrawler['id'], urlPrefix: string): SiteCrawler => ({
  id,
  isProductUrl: (url) => url.startsWith(urlPrefix),
  collectProductUrls: async () => [],
  scrapeProduct: async () => null,
})

describe('findSiteCrawlerByProductUrl', () => {
  const crawlers = [
    createCrawlerStub('rewe', 'https://rewe/'),
    createCrawlerStub('wolt', 'https://wolt/'),
  ]

  describe('given a URL that one site accepts', () => {
    it('returns that site crawler', () => {
      expect(findSiteCrawlerByProductUrl('https://wolt/item', crawlers)?.id).toBe('wolt')
    })
  })

  describe('given a URL that no site accepts', () => {
    it('returns undefined', () => {
      expect(findSiteCrawlerByProductUrl('https://other/item', crawlers)).toBeUndefined()
    })
  })
})
