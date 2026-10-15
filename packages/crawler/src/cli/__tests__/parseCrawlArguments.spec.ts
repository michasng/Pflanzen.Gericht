import { Command } from 'commander'
import { describe, expect, it, vi } from 'vitest'
import { parseCrawlArguments } from '../parseCrawlArguments.js'

const REWE_PRODUCT_URL =
  'https://www.rewe.de/shop/p/better-nature-tempeh-geraeuchert-vegan-220g/9006709'
const SECOND_REWE_PRODUCT_URL =
  'https://www.rewe.de/shop/p/zueger-bio-cottage-drops-vegan-200g/9012174'
const KNUSPR_PRODUCT_URL = 'https://www.knuspr.de/28605-vegan-product'
const UNSUPPORTED_URL = 'https://example.test/product'

describe('parseCrawlArguments', () => {
  const setup = () => {
    const writeError = vi.fn<(message: string) => void>()
    const program = new Command().exitOverride().configureOutput({ writeErr: writeError })
    return { program, writeError }
  }

  describe('given product URLs from one site', () => {
    it.each([
      [REWE_PRODUCT_URL],
      [REWE_PRODUCT_URL, SECOND_REWE_PRODUCT_URL],
      [KNUSPR_PRODUCT_URL],
    ])('accepts the URLs beginning with %s', (...urls) => {
      const { program } = setup()

      const { options, siteCrawler } = parseCrawlArguments(['--urls', ...urls], program)

      expect(options.urls).toEqual(urls)
      expect(urls.every((url) => siteCrawler.isProductUrl(url))).toBe(true)
    })
  })

  describe('given product URLs from different sites', () => {
    it('rejects the entire request', () => {
      const { program } = setup()

      expect(() =>
        parseCrawlArguments(['--urls', REWE_PRODUCT_URL, KNUSPR_PRODUCT_URL], program),
      ).toThrow('All URLs must be product pages from the same site')
    })
  })

  describe('given an unsupported URL', () => {
    it('rejects an unsupported first URL', () => {
      const { program } = setup()

      expect(() => parseCrawlArguments(['--urls', UNSUPPORTED_URL], program)).toThrow(
        `No site supports the URL "${UNSUPPORTED_URL}"`,
      )
    })

    it.each([UNSUPPORTED_URL, 'not-a-url', 'https://www.rewe.de/shop/'])(
      'rejects an invalid later URL: %s',
      (url) => {
        const { program } = setup()

        expect(() => parseCrawlArguments(['--urls', REWE_PRODUCT_URL, url], program)).toThrow(
          `Unsupported URL: "${url}"`,
        )
      },
    )
  })

  describe('given incompatible options', () => {
    it.each([['--site', 'rewe'], ['--limit', '1'], ['--skip', '1'], ['--continue']])(
      'rejects %s in either argument order',
      (...conflictingArguments) => {
        for (const arguments_ of [
          ['--urls', REWE_PRODUCT_URL, ...conflictingArguments],
          [...conflictingArguments, '--urls', REWE_PRODUCT_URL],
        ]) {
          const { program } = setup()

          expect(() => parseCrawlArguments(arguments_, program)).toThrow(
            'cannot be used with option',
          )
        }
      },
    )
  })

  describe('given missing or obsolete arguments', () => {
    it('requires either a site or product URLs', () => {
      const { program, writeError } = setup()

      expect(() => parseCrawlArguments([], program)).toThrow('Either --site or --urls is required.')
      expect(writeError).toHaveBeenCalledWith(
        expect.stringContaining('Either --site or --urls is required.'),
      )
    })

    it('requires at least one URL', () => {
      const { program } = setup()

      expect(() => parseCrawlArguments(['--urls'], program)).toThrow('argument missing')
    })

    it('rejects the replaced singular option', () => {
      const { program } = setup()

      expect(() => parseCrawlArguments(['--url', REWE_PRODUCT_URL], program)).toThrow(
        "unknown option '--url'",
      )
    })
  })

  describe('given a site crawl', () => {
    it('preserves listing options', () => {
      const { program } = setup()

      const { options, siteCrawler } = parseCrawlArguments(
        ['--site', 'rewe', '--limit', '5', '--skip', '2', '--continue'],
        program,
      )

      expect(siteCrawler.id).toBe('rewe')
      expect(options).toEqual({ site: 'rewe', limit: '5', skip: '2', continue: true })
    })

    it('rejects an unknown site', () => {
      const { program } = setup()

      expect(() => parseCrawlArguments(['--site', 'unknown'], program)).toThrow(
        'Unknown site "unknown"',
      )
    })
  })
})
