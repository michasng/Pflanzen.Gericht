import { describe, expect, it } from 'vitest'
import { findExistingProductMatches } from '../findExistingProductMatches.js'
import type { ExistingProductSummary } from '../loadExistingProducts.js'

const buildExisting = (id: string, sourceUrls: string[]): ExistingProductSummary =>
  ({ id, sourceUrls }) as ExistingProductSummary // only the fields under test are relevant

describe('findExistingProductMatches', () => {
  describe('given no existing product has the source URL', () => {
    it('returns no matches', () => {
      const existing = [buildExisting('a', ['https://a.test/1'])]

      const matches = findExistingProductMatches('https://b.test/1', existing)

      expect(matches).toEqual([])
    })
  })

  describe('given an existing product has the source URL', () => {
    it('returns that product', () => {
      const existing = [buildExisting('a', ['https://a.test/1']), buildExisting('b', [])]

      const matches = findExistingProductMatches('https://a.test/1', existing)

      expect(matches.map((match) => match.id)).toEqual(['a'])
    })
  })

  describe('given an existing product also has source URLs of other stores', () => {
    it('returns that product', () => {
      const existing = [buildExisting('a', ['https://rewe.test/1', 'https://wolt.test/1'])]

      const matches = findExistingProductMatches('https://wolt.test/1', existing)

      expect(matches.map((match) => match.id)).toEqual(['a'])
    })
  })

  describe('given several existing products have the source URL', () => {
    it('returns each of them', () => {
      const existing = [
        buildExisting('a', ['https://rewe.test/1']),
        buildExisting('b', ['https://rewe.test/1', 'https://wolt.test/1']),
        buildExisting('c', ['https://other.test/1']),
      ]

      const matches = findExistingProductMatches('https://rewe.test/1', existing)

      expect(matches.map((match) => match.id)).toEqual(['a', 'b'])
    })
  })
})
