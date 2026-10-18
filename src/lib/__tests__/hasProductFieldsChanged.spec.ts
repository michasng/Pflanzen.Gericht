import { describe, expect, it } from 'vitest'
import { createProduct } from '@/__tests__/createProduct'
import { QuantityUnit } from '@/config/quantity'
import type { ProductFields } from '@/types/productForm'
import { hasProductFieldsChanged } from '../hasProductFieldsChanged'

const createFields = (overrides: Partial<ProductFields> = {}): ProductFields => ({
  name: 'Hafermilch',
  category: 'drink',
  base: null,
  brand: 'Alpro',
  description: null,
  energyJoules: null,
  allergens: [],
  isOrganic: false,
  barcode: null,
  quantityUnit: QuantityUnit.Piece,
  quantityValue: 1,
  ...overrides,
})

describe('hasProductFieldsChanged', () => {
  describe('given identical fields', () => {
    it('is false', () => {
      expect(hasProductFieldsChanged(createProduct(), createFields())).toBe(false)
    })
  })

  describe('given a changed field', () => {
    it('is true', () => {
      expect(hasProductFieldsChanged(createProduct(), createFields({ name: 'Sojamilch' }))).toBe(
        true,
      )
    })
  })

  describe('given the same allergens in a different order', () => {
    it('is false', () => {
      const product = createProduct({ allergens: ['soy', 'gluten'] })

      expect(hasProductFieldsChanged(product, createFields({ allergens: ['gluten', 'soy'] }))).toBe(
        false,
      )
    })
  })

  describe('given a different allergen', () => {
    it('is true', () => {
      const product = createProduct({ allergens: ['soy'] })

      expect(hasProductFieldsChanged(product, createFields({ allergens: ['gluten'] }))).toBe(true)
    })
  })
})
