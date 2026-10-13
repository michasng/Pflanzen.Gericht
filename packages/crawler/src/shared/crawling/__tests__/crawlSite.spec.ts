import { describe, expect, it, vi } from 'vitest'
import type { Logger } from '../../logging/logger.js'
import { crawlSite } from '../crawlSite.js'
import { buildCrawledProduct } from './buildCrawledProduct.js'
import { collectAsync } from './collectAsync.js'

const COLLECTED_URLS = [
  'https://example.test/a',
  'https://example.test/b',
  'https://example.test/c',
]
const NO_EXCLUDED_URLS: ReadonlySet<string> = new Set()

describe('crawlSite', () => {
  const setup = () => {
    const logger: Logger = {
      info: vi.fn<(message: string) => void>(),
      warn: vi.fn<(message: string) => void>(),
      error: vi.fn<(message: string) => void>(),
    }
    const context = { logger, navigateTo: async () => {} }
    const collectProductUrls = vi.fn<
      (collectContext: typeof context, collectLimit: number | null) => Promise<string[]>
    >(async () => COLLECTED_URLS)
    const siteCrawler = {
      collectProductUrls,
      productPageSelector: '#product',
      scrapeProduct: async (_context: typeof context, productUrl: string) =>
        buildCrawledProduct(productUrl),
    }
    return { logger, context, collectProductUrls, siteCrawler }
  }

  describe('given a skip and a limit', () => {
    it('collects enough urls to cover both', async () => {
      const { context, collectProductUrls, siteCrawler } = setup()

      await collectAsync(
        crawlSite(siteCrawler, context, {
          skip: 1,
          limit: 1,
          excludedProductUrls: NO_EXCLUDED_URLS,
        }),
      )

      expect(collectProductUrls).toHaveBeenCalledWith(context, 2)
    })

    it('crawls only the selected products', async () => {
      const { context, siteCrawler } = setup()

      const products = await collectAsync(
        crawlSite(siteCrawler, context, {
          skip: 1,
          limit: 1,
          excludedProductUrls: NO_EXCLUDED_URLS,
        }),
      )

      expect(products.map((product) => product.sourceUrl)).toEqual(['https://example.test/b'])
    })
  })

  describe('given already crawled products', () => {
    it('collects enough urls to cover them as well', async () => {
      const { context, collectProductUrls, siteCrawler } = setup()

      await collectAsync(
        crawlSite(siteCrawler, context, {
          skip: 1,
          limit: 1,
          excludedProductUrls: new Set(['https://example.test/b']),
        }),
      )

      expect(collectProductUrls).toHaveBeenCalledWith(context, 3)
    })

    it('crawls only products that were not crawled yet', async () => {
      const { context, siteCrawler } = setup()

      const products = await collectAsync(
        crawlSite(siteCrawler, context, {
          skip: 1,
          limit: 1,
          excludedProductUrls: new Set(['https://example.test/b']),
        }),
      )

      expect(products.map((product) => product.sourceUrl)).toEqual(['https://example.test/c'])
    })
  })

  describe('given no limit', () => {
    it('reports how many products will be crawled', async () => {
      const { logger, context, siteCrawler } = setup()

      await collectAsync(
        crawlSite(siteCrawler, context, {
          skip: 0,
          limit: null,
          excludedProductUrls: NO_EXCLUDED_URLS,
        }),
      )

      expect(logger.info).toHaveBeenCalledWith('Found 3 candidate product links.')
    })
  })
})
