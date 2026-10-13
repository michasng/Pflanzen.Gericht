import { describe, expect, it } from 'vitest'
import {
  collectProductUrlsFromListings,
  type ListingPage,
} from '../collectProductUrlsFromListings.js'

const createReader = (pages: Record<string, Partial<ListingPage>>) => {
  const requestedUrls: string[] = []
  const readListingPage = async (url: string): Promise<ListingPage> => {
    requestedUrls.push(url)
    return { productUrls: [], loadMoreUrls: [], lastPageNumber: 1, ...pages[url] }
  }
  return { readListingPage, requestedUrls }
}

describe('collectProductUrlsFromListings', () => {
  describe('given a listing with several pages', () => {
    it('collects products from every page', async () => {
      const reader = createReader({
        'https://x/a': { productUrls: ['p1'], lastPageNumber: 2 },
        'https://x/a?page=2': { productUrls: ['p2'] },
      })

      const result = await collectProductUrlsFromListings({
        listingUrls: ['https://x/a'],
        limit: null,
        readListingPage: reader.readListingPage,
      })

      expect(result).toEqual(['p1', 'p2'])
    })
  })

  describe('given a load-more link', () => {
    it('follows it and scrapes shared products once', async () => {
      const reader = createReader({
        'https://x/a': { productUrls: ['p1', 'p2'], loadMoreUrls: ['https://x/b'] },
        'https://x/b': { productUrls: ['p2', 'p3'] },
      })

      const result = await collectProductUrlsFromListings({
        listingUrls: ['https://x/a'],
        limit: null,
        readListingPage: reader.readListingPage,
      })

      expect(result).toEqual(['p1', 'p2', 'p3'])
    })
  })

  describe('given a load-more link to an already visited listing', () => {
    it('does not read it twice', async () => {
      const reader = createReader({
        'https://x/a': { loadMoreUrls: ['https://x/b'] },
        'https://x/b': { loadMoreUrls: ['https://x/a'] },
      })

      await collectProductUrlsFromListings({
        listingUrls: ['https://x/a', 'https://x/b'],
        limit: null,
        readListingPage: reader.readListingPage,
      })

      expect(reader.requestedUrls).toEqual(['https://x/a', 'https://x/b'])
    })
  })

  describe('given a limit', () => {
    it('returns at most that many products and stops reading', async () => {
      const reader = createReader({
        'https://x/a': { productUrls: ['p1', 'p2', 'p3'] },
        'https://x/b': { productUrls: ['p4'] },
      })

      const result = await collectProductUrlsFromListings({
        listingUrls: ['https://x/a', 'https://x/b'],
        limit: 2,
        readListingPage: reader.readListingPage,
      })

      expect(result).toEqual(['p1', 'p2'])
      expect(reader.requestedUrls).toEqual(['https://x/a'])
    })
  })
})
