import { QuantityUnit } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../../schema/crawledProduct.js'

export const buildCrawledProduct = (sourceUrl: string): CrawledProduct => ({
  site: 'rewe',
  sourceUrl,
  name: 'Tofu',
  brand: 'Brand',
  quantityUnit: QuantityUnit.Gram,
  quantityValue: 200,
  description: null,
  category: null,
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
})
