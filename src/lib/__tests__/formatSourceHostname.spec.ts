import { describe, expect, it } from 'vitest'
import { formatSourceHostname } from '../formatSourceHostname'

describe('formatSourceHostname', () => {
  describe('given a url with a language subdomain', () => {
    it('returns the site without the subdomain', () => {
      expect(
        formatSourceHostname('https://de.openfoodfacts.org/produkt/8000500426494/nutella'),
      ).toBe('openfoodfacts.org')
    })
  })

  describe('given a url with a www subdomain', () => {
    it('returns the site without www', () => {
      expect(formatSourceHostname('https://www.rewe.de/shop/p/nutella/9946679')).toBe('rewe.de')
    })
  })

  describe('given a url without a subdomain', () => {
    it('returns the hostname unchanged', () => {
      expect(formatSourceHostname('https://rewe.de/')).toBe('rewe.de')
    })
  })

  describe('given a two-letter domain label', () => {
    it('keeps the hostname when stripping would leave no top-level domain', () => {
      expect(formatSourceHostname('https://co.uk/')).toBe('co.uk')
    })
  })
})
