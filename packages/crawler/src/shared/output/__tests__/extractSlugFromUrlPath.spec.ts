import { describe, expect, it } from 'vitest'
import { extractSlugFromUrlPath } from '../extractSlugFromUrlPath.js'

describe('extractSlugFromUrlPath', () => {
  describe('given a REWE product URL with name and id segments', () => {
    it('joins both segments', () => {
      const sourceUrl = 'https://www.rewe.de/shop/p/ahoj-brause-brause-brocken-vegan-10x8g/4571959'

      expect(extractSlugFromUrlPath(sourceUrl, 2)).toBe(
        'ahoj-brause-brause-brocken-vegan-10x8g-4571959',
      )
    })
  })

  describe('given a Knuspr product URL', () => {
    it('uses the only segment', () => {
      expect(
        extractSlugFromUrlPath('https://www.knuspr.de/29432-yutto-bio-sojadrink-vegan', 1),
      ).toBe('29432-yutto-bio-sojadrink-vegan')
    })
  })

  describe('given a Wolt product URL', () => {
    it('uses the last segment', () => {
      const sourceUrl =
        'https://wolt.com/en/deu/munich/venue/wolt-market-schwabing/alnatura-haferdrink-natur-bio-1-l-itemid-68b00a0d08ad4903740966c7'

      expect(extractSlugFromUrlPath(sourceUrl, 1)).toBe(
        'alnatura-haferdrink-natur-bio-1-l-itemid-68b00a0d08ad4903740966c7',
      )
    })
  })

  describe('given a trailing slash and query string', () => {
    it('ignores both', () => {
      expect(extractSlugFromUrlPath('https://www.knuspr.de/29432-yutto/?source=list', 1)).toBe(
        '29432-yutto',
      )
    })
  })
})
