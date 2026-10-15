import { describe, expect, it } from 'vitest'
import type { Base } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import { buildCrawledProduct } from '../crawling/__tests__/buildCrawledProduct.js'
import { remapBases } from '../remapBases.js'

const buildProduct = (base: Base | null, ingredientsRawText: string | null): CrawledProduct => ({
  ...buildCrawledProduct('https://example.com/product'),
  base,
  ingredientsRawText,
})

const resolveBase = (ingredientsRawText: string | null): Base | null =>
  ingredientsRawText === 'Hafer' ? 'oat' : null

describe('remapBases', () => {
  describe('given a product whose base differs from its ingredients', () => {
    it('reports it as changed with the resolved base', () => {
      const product = buildProduct('soy', 'Hafer')

      const result = remapBases([product], resolveBase)

      expect(result).toEqual({
        changedProducts: [{ ...product, base: 'oat' }],
        unresolvedProducts: [],
      })
    })
  })

  describe('given a product whose base no longer resolves', () => {
    it('reports it as changed and unresolved with a cleared base', () => {
      const product = buildProduct('soy', null)
      const clearedProduct = { ...product, base: null }

      const result = remapBases([product], resolveBase)

      expect(result).toEqual({
        changedProducts: [clearedProduct],
        unresolvedProducts: [clearedProduct],
      })
    })
  })

  describe('given a product whose base already matches', () => {
    it('reports nothing', () => {
      const product = buildProduct('oat', 'Hafer')

      const result = remapBases([product], resolveBase)

      expect(result).toEqual({ changedProducts: [], unresolvedProducts: [] })
    })
  })

  describe('given a product without a base that still does not resolve', () => {
    it('reports it as unresolved only', () => {
      const product = buildProduct(null, 'Erdnuss')

      const result = remapBases([product], resolveBase)

      expect(result).toEqual({ changedProducts: [], unresolvedProducts: [product] })
    })
  })
})
