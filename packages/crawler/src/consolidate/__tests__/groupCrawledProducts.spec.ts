import { describe, expect, it, vi } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import { groupCrawledProductsBySameProduct } from '../groupCrawledProducts.js'
import { createLogger } from '../../shared/logging/logger.js'

const buildProduct = (overrides: Partial<CrawledProduct>): CrawledProduct => ({
  site: 'rewe',
  sourceUrl: 'https://example.test/product',
  name: 'Tofu Natur',
  brand: 'Alpro',
  quantityUnit: QuantityUnit.Gram,
  quantityValue: 400,
  description: null,
  category: 'cheese',
  base: null,
  allergens: [],
  isOrganic: false,
  barcode: null,
  energyKilojoules: null,
  nutrientsPer100g: {},
  ingredientsRawText: null,
  priceEuroCents: 199,
  salePriceEuroCents: null,
  imageSourceUrl: null,
  crawledAt: '2026-01-01T00:00:00.000Z',
  siteDetails: null,
  ...overrides,
})

describe('groupCrawledProductsBySameProduct', () => {
  it('given the same product from two sites, keeps the first site descriptive info and both prices', () => {
    const rewe = buildProduct({ site: 'rewe', priceEuroCents: 199 })
    const knuspr = buildProduct({ site: 'knuspr', priceEuroCents: 179, description: 'from knuspr' })

    const candidates = groupCrawledProductsBySameProduct([rewe, knuspr], createLogger('test'))

    expect(candidates).toHaveLength(1)
    const [onlyCandidate] = candidates
    expect(onlyCandidate).toBeDefined()
    expect(onlyCandidate?.primary).toBe(rewe)
    expect(onlyCandidate?.prices.map((p) => p.site)).toEqual(['rewe', 'knuspr'])
  })

  it('given products with different names, keeps them as separate candidates', () => {
    const a = buildProduct({ name: 'Tofu Natur' })
    const b = buildProduct({ name: 'Tofu Geräuchert' })

    const candidates = groupCrawledProductsBySameProduct([a, b], createLogger('test'))

    expect(candidates).toHaveLength(2)
  })

  it('logs every match it finds', () => {
    const logger = createLogger('test')
    const infoSpy = vi.spyOn(logger, 'info')
    const rewe = buildProduct({ site: 'rewe' })
    const knuspr = buildProduct({ site: 'knuspr' })

    groupCrawledProductsBySameProduct([rewe, knuspr], logger)

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate match'))
  })
})
