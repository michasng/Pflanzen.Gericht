import { describe, expect, it } from 'vitest'
import { toProductFormValues } from '../toProductFormValues'
import type { Product, ProductIngredient, ProductNutrient, ProductSource } from '@/types'

const product: Product = {
  allergens: ['soy', 'unknown'],
  avgOverall: null,
  barcode: null,
  base: null,
  brand: 'Alpro',
  category: 'drink',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'user-1',
  description: null,
  energyJoules: 100,
  id: 'product',
  isOrganic: true,
  minPriceEuroCents: null,
  name: 'Drink',
  normalizedName: 'drink',
  quantityUnit: 'piece',
  quantityValue: 1,
  reviewsCount: 0,
  tags: [],
  updatedAt: '2026-01-01T00:00:00Z',
}
const ingredient: ProductIngredient = {
  comparator: '≥',
  createdAt: '2026-01-01T00:00:00Z',
  fractionBasisPoints: 500,
  id: 'ingredient',
  name: 'Soja',
  productId: 'product',
}
const nutrient: ProductNutrient = {
  amountMicrograms: 1000,
  createdAt: '2026-01-01T00:00:00Z',
  id: 'nutrient',
  name: 'Fett',
  productId: 'product',
}

const source: ProductSource = {
  createdAt: '2026-01-01T00:00:00Z',
  id: 'source',
  productId: 'product',
  url: 'https://www.rewe.de/shop/p/nutella/9946679',
}

describe('toProductFormValues', () => {
  describe('given a product with an unknown allergen', () => {
    it('keeps only known allergens and maps database names', () => {
      const values = toProductFormValues(product, [ingredient], [nutrient], [source])

      expect(values).toMatchObject({
        allergens: ['soy'],
        energyJoules: 100,
        isOrganic: true,
        ingredients: [{ name: 'Soja', fractionBasisPoints: 500, comparator: '≥' }],
        nutrients: [{ name: 'Fett', amountMicrograms: 1000 }],
        sourceUrls: ['https://www.rewe.de/shop/p/nutella/9946679'],
        quantityUnit: 'piece',
        quantityValue: 1,
      })
    })
  })
})
