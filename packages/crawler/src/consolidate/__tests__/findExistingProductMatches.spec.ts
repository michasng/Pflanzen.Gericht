import { describe, expect, it } from 'vitest'
import type { ConsolidatedCandidate } from '../candidate.js'
import { findExistingProductMatches } from '../findExistingProductMatches.js'
import type { ExistingProductSummary } from '../loadExistingProducts.js'

const buildExisting = (id: string, sourceUrls: string[]): ExistingProductSummary =>
  ({ id, sourceUrls }) as ExistingProductSummary // only the fields under test are relevant

const buildCandidate = (sourceUrls: string[]): ConsolidatedCandidate =>
  ({
    prices: sourceUrls.map((sourceUrl) => ({ sourceUrl })),
  }) as ConsolidatedCandidate // only the fields under test are relevant

describe('findExistingProductMatches', () => {
  describe('given no existing product shares a source URL', () => {
    it('returns no matches', () => {
      const existing = [buildExisting('a', ['https://a.test/1'])]

      const matches = findExistingProductMatches(buildCandidate(['https://b.test/1']), existing)

      expect(matches).toEqual([])
    })
  })

  describe('given an existing product shares a source URL', () => {
    it('returns that product', () => {
      const existing = [buildExisting('a', ['https://a.test/1']), buildExisting('b', [])]

      const matches = findExistingProductMatches(buildCandidate(['https://a.test/1']), existing)

      expect(matches.map((match) => match.id)).toEqual(['a'])
    })
  })

  describe('given the candidate was found on several sites', () => {
    it('matches through any of its URLs', () => {
      const existing = [buildExisting('a', ['https://wolt.test/1'])]

      const matches = findExistingProductMatches(
        buildCandidate(['https://rewe.test/1', 'https://wolt.test/1']),
        existing,
      )

      expect(matches.map((match) => match.id)).toEqual(['a'])
    })
  })

  describe('given different existing products share different candidate URLs', () => {
    it('returns each product once', () => {
      const existing = [
        buildExisting('a', ['https://rewe.test/1', 'https://wolt.test/1']),
        buildExisting('b', ['https://wolt.test/1']),
        buildExisting('c', ['https://other.test/1']),
      ]

      const matches = findExistingProductMatches(
        buildCandidate(['https://rewe.test/1', 'https://wolt.test/1']),
        existing,
      )

      expect(matches.map((match) => match.id)).toEqual(['a', 'b'])
    })
  })
})
