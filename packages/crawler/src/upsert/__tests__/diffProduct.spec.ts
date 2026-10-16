import { describe, expect, it } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import type { CrawledProduct } from '../../schema/crawledProduct.js'
import { diffProduct } from '../diffProduct.js'
import type { ExistingProductSummary } from '../loadExistingProductMatches.js'
import type { ExistingProductDetail } from '../loadExistingProductDetail.js'

const buildCandidate = (overrides: Partial<CrawledProduct> = {}): CrawledProduct => ({
  site: 'rewe',
  sourceUrl: 'https://example.test/product',
  slug: 'alpro-tofu-natur-400g',
  name: 'Tofu Natur',
  brand: 'Alpro',
  quantityUnit: QuantityUnit.Gram,
  quantityValue: 400,
  description: 'Bio Tofu',
  category: 'cheese',
  base: 'soy',
  allergens: ['soy'],
  isOrganic: true,
  barcode: null,
  energyKilojoules: 600,
  nutrientsPer100g: { Fett: 5, Eiweiß: 12 },
  ingredientsRawText: 'Wasser, Sojabohnen',
  priceEuroCents: 199,
  salePriceEuroCents: null,
  imageSourceUrl: null,
  crawledAt: '2026-01-01T00:00:00.000Z',
  siteDetails: null,
  ...overrides,
})

const buildExisting = (overrides: Partial<ExistingProductSummary> = {}): ExistingProductSummary =>
  ({
    id: 'existing-id',
    name: 'Tofu Natur',
    brand: 'Alpro',
    quantity_unit: QuantityUnit.Gram,
    quantity_value: 400,
    description: 'Bio Tofu',
    category: 'cheese',
    base: 'soy',
    allergens: ['soy'],
    is_organic: true,
    barcode: null,
    energy_joules: 600_000,
    ...overrides,
  }) as ExistingProductSummary

const emptyDetail: ExistingProductDetail = { ingredients: [], nutrients: [] }

describe('diffProduct', () => {
  it('given identical candidate and existing product, returns no differences', () => {
    const detail: ExistingProductDetail = {
      ingredients: [
        { name: 'Wasser, Sojabohnen', comparator: '=', fraction_basis_points: null } as never,
      ],
      nutrients: [
        { name: 'Fett', amount_micrograms: 5_000_000 } as never,
        { name: 'Eiweiß', amount_micrograms: 12_000_000 } as never,
      ],
    }
    expect(diffProduct(buildCandidate(), buildExisting(), detail)).toEqual([])
  })

  it('given a different description, reports only that field', () => {
    const candidate = buildCandidate({ description: 'Neue Beschreibung' })
    const diff = diffProduct(candidate, buildExisting(), emptyDetail)
    expect(diff.map((entry) => entry.field)).toContain('description')
  })

  it('given a candidate with no matching nutrient rows in the DB, reports the nutrients field', () => {
    const diff = diffProduct(buildCandidate(), buildExisting(), emptyDetail)
    expect(diff.map((entry) => entry.field)).toContain('nutrientsMicrograms')
  })
})
