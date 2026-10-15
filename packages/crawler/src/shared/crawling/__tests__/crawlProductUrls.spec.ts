import { describe, expect, it, vi } from 'vitest'
import { createConfirmingNavigator } from '../../browser/createConfirmingNavigator.js'
import { crawlProductUrls } from '../crawlProductUrls.js'
import { buildCrawledProduct } from './buildCrawledProduct.js'
import { collectAsync } from './collectAsync.js'

const SKIPPED_URL = 'https://example.test/skipped'
const PRODUCT_PAGE_SELECTOR = '#product'

describe('crawlProductUrls', () => {
  const setup = () => {
    const events: string[] = []
    const context = {
      navigateTo: async (url: string, expectedSelector: string) => {
        events.push(`navigate ${url} expecting ${expectedSelector}`)
      },
    }
    const productScraper = {
      productPageSelector: PRODUCT_PAGE_SELECTOR,
      scrapeProduct: async (_context: typeof context, productUrl: string) => {
        events.push(`scrape ${productUrl}`)
        return productUrl === SKIPPED_URL ? null : buildCrawledProduct(productUrl)
      },
    }
    return { events, context, productScraper }
  }

  describe('given product urls', () => {
    it('navigates to each product page before scraping it', async () => {
      const { events, context, productScraper } = setup()

      await collectAsync(
        crawlProductUrls(productScraper, context, [
          'https://example.test/a',
          'https://example.test/b',
        ]),
      )

      expect(events).toEqual([
        `navigate https://example.test/a expecting ${PRODUCT_PAGE_SELECTOR}`,
        'scrape https://example.test/a',
        `navigate https://example.test/b expecting ${PRODUCT_PAGE_SELECTOR}`,
        'scrape https://example.test/b',
      ])
    })

    it('reuses the context and confirms session setup only once for all products', async () => {
      const { context, productScraper } = setup()
      const confirmSessionSetup = vi.fn<() => Promise<void>>(async () => {})
      const sharedContext = {
        navigateTo: createConfirmingNavigator(context.navigateTo, confirmSessionSetup),
      }
      const scrapeProduct = vi.fn<typeof productScraper.scrapeProduct>(productScraper.scrapeProduct)
      const productUrls = ['https://example.test/a', 'https://example.test/b']

      const products = await collectAsync(
        crawlProductUrls({ ...productScraper, scrapeProduct }, sharedContext, productUrls),
      )

      expect(products.map((product) => product.sourceUrl)).toEqual(productUrls)
      expect(confirmSessionSetup).toHaveBeenCalledTimes(1)
      expect(scrapeProduct).toHaveBeenNthCalledWith(1, sharedContext, productUrls[0])
      expect(scrapeProduct).toHaveBeenNthCalledWith(2, sharedContext, productUrls[1])
    })
  })

  describe('given a product that cannot be scraped', () => {
    it('yields only the scraped products', async () => {
      const { context, productScraper } = setup()

      const products = await collectAsync(
        crawlProductUrls(productScraper, context, [SKIPPED_URL, 'https://example.test/a']),
      )

      expect(products.map((product) => product.sourceUrl)).toEqual(['https://example.test/a'])
    })
  })
})
