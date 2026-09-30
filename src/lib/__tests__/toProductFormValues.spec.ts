import { describe, expect, it } from 'vitest'
import { toProductFormValues } from '../toProductFormValues'
import type { Product, ProductIngredient, ProductNutrient } from '@/types'

const product: Product = {
  allergens: ['soy', 'unknown'],
  avg_overall: null,
  barcode: null,
  base: null,
  brand: 'Alpro',
  category: 'drink',
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
  description: null,
  energy_joules: 100,
  id: 'product',
  is_organic: true,
  min_price_euro_cents: null,
  name: 'Drink',
  normalized_name: 'drink',
  reviews_count: 0,
  tags: [],
  updated_at: '2026-01-01T00:00:00Z',
}
const ingredient: ProductIngredient = {
  comparator: '≥',
  created_at: '2026-01-01T00:00:00Z',
  fraction_basis_points: 500,
  id: 'ingredient',
  name: 'Soja',
  product_id: 'product',
}
const nutrient: ProductNutrient = {
  amount_micrograms: 1000,
  created_at: '2026-01-01T00:00:00Z',
  id: 'nutrient',
  name: 'Fett',
  product_id: 'product',
}

describe('toProductFormValues', () => {
  describe('given a product with an unknown allergen', () => {
    it('keeps only known allergens and maps database names', () => {
      const values = toProductFormValues(product, [ingredient], [nutrient])

      expect(values).toMatchObject({
        allergens: ['soy'],
        energyJoules: 100,
        isOrganic: true,
        ingredients: [{ name: 'Soja', fractionBasisPoints: 500, comparator: '≥' }],
        nutrients: [{ name: 'Fett', amountMicrograms: 1000 }],
      })
    })
  })
})
