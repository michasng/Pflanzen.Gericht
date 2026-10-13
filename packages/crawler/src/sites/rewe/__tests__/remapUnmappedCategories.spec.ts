import { describe, expect, it } from 'vitest'
import type { Category } from '@pflanzen-gericht/contracts'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../../schema/crawledProduct.js'
import type { ReweSiteDetails } from '../reweSiteDetails.js'
import { remapUnmappedCategories } from '../remapUnmappedCategories.js'

const buildProduct = (
  category: Category | null,
  categorySlug: string | null,
): CrawledProduct<ReweSiteDetails> => ({
  site: 'rewe',
  sourceUrl: `https://www.rewe.de/shop/p/${categorySlug}/1`,
  name: 'Name',
  brand: 'Brand',
  quantityUnit: QuantityUnit.Gram,
  quantityValue: 100,
  description: null,
  category,
  base: null,
  allergens: [],
  isOrganic: false,
  barcode: null,
  energyKilojoules: null,
  nutrientsPer100g: {},
  ingredientsRawText: null,
  priceEuroCents: 100,
  salePriceEuroCents: null,
  imageSourceUrl: null,
  crawledAt: '2026-01-01T00:00:00.000Z',
  siteDetails: { categorySlug },
})

const resolveCategory = (slug: string | null): Category | null => (slug === 'tofu' ? 'other' : null)

describe('remapUnmappedCategories', () => {
  describe('given an unmapped product whose slug is now known', () => {
    it('returns it with the category', () => {
      const result = remapUnmappedCategories([buildProduct(null, 'tofu')], resolveCategory)

      expect(result.remappedProducts.map((product) => product.category)).toEqual(['other'])
    })
  })

  describe('given an unmapped product whose slug is still unknown', () => {
    it('lists the slug once, sorted', () => {
      const result = remapUnmappedCategories(
        [buildProduct(null, 'b'), buildProduct(null, 'a'), buildProduct(null, 'b')],
        resolveCategory,
      )

      expect(result.unmappedCategorySlugs).toEqual(['a', 'b'])
      expect(result.remappedProducts).toEqual([])
    })
  })

  describe('given a product that already has a category', () => {
    it('leaves it alone', () => {
      const result = remapUnmappedCategories([buildProduct('meat', 'tofu')], resolveCategory)

      expect(result.remappedProducts).toEqual([])
    })
  })
})
