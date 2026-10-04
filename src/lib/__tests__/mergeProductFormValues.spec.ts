import { describe, expect, it } from 'vitest'
import { mergeProductFormValues } from '../mergeProductFormValues'
import { QuantityUnit } from '@/config/quantity'
import type { ProductFormValues } from '@/types/productForm'

describe('mergeProductFormValues', () => {
  const buildValues = (overrides: Partial<ProductFormValues>): ProductFormValues => ({
    name: 'Soja Drink',
    category: 'drink',
    base: 'soy',
    brand: 'Alpro',
    description: 'Lecker',
    energyJoules: 1500,
    allergens: ['soy'],
    isOrganic: true,
    barcode: '4006381333931',
    quantityUnit: QuantityUnit.Milliliter,
    quantityValue: 1000,
    ingredients: [],
    nutrients: [],
    sourceUrls: [],
    ...overrides,
  })

  describe('given two identical products', () => {
    it('keeps every value', () => {
      const values = buildValues({
        ingredients: [{ name: 'Soja', fractionBasisPoints: 800, comparator: '=' }],
        nutrients: [{ name: 'Protein', amountMicrograms: 3_000_000 }],
      })

      expect(mergeProductFormValues(values, values)).toEqual(values)
    })
  })

  describe('given products with different sources', () => {
    it('keeps every source once', () => {
      const result = mergeProductFormValues(
        buildValues({ sourceUrls: ['https://a.de/x', 'https://b.de/y'] }),
        buildValues({ sourceUrls: ['https://b.de/y', 'https://c.de/z'] }),
      )

      expect(result.sourceUrls).toEqual(['https://a.de/x', 'https://b.de/y', 'https://c.de/z'])
    })
  })

  describe('given products that claim conflicting scalar values', () => {
    it('leaves only those fields undecided', () => {
      const result = mergeProductFormValues(
        buildValues({ name: 'Name A' }),
        buildValues({ name: 'Name B' }),
      )

      expect(result.name).toBeUndefined()
      expect(result.brand).toBe('Alpro')
    })
  })

  describe('given products with different quantities', () => {
    it('leaves unit and value undecided together', () => {
      const result = mergeProductFormValues(
        buildValues({ quantityUnit: QuantityUnit.Gram, quantityValue: 500 }),
        buildValues({ quantityUnit: QuantityUnit.Milliliter, quantityValue: 500 }),
      )

      expect(result.quantityUnit).toBeUndefined()
      expect(result.quantityValue).toBeUndefined()
    })

    it('leaves both undecided when only the value differs', () => {
      const result = mergeProductFormValues(
        buildValues({ quantityValue: 500 }),
        buildValues({ quantityValue: 1000 }),
      )

      expect(result.quantityUnit).toBeUndefined()
      expect(result.quantityValue).toBeUndefined()
    })
  })

  describe('given one product that lacks claims the other makes', () => {
    it('fills the gaps from the other product', () => {
      const sparse = buildValues({ brand: '', description: '', isOrganic: false })

      expect(mergeProductFormValues(sparse, buildValues({}))).toMatchObject({
        brand: 'Alpro',
        description: 'Lecker',
        isOrganic: true,
      })
    })
  })

  describe('given lists that differ', () => {
    it('unions allergens, ingredients and nutrients', () => {
      const a = buildValues({
        allergens: ['soy'],
        ingredients: [{ name: 'Soja', fractionBasisPoints: 800, comparator: '=' }],
        nutrients: [{ name: 'Protein', amountMicrograms: 3_000_000 }],
      })
      const b = buildValues({
        allergens: ['nuts'],
        ingredients: [{ name: 'Salz', fractionBasisPoints: null, comparator: '=' }],
        nutrients: [{ name: 'Fett', amountMicrograms: 1_000_000 }],
      })

      const result = mergeProductFormValues(a, b)

      expect(result.allergens).toEqual(['soy', 'nuts'])
      expect(result.ingredients?.map((ingredient) => ingredient.name)).toEqual(['Soja', 'Salz'])
      expect(result.nutrients?.map((nutrient) => nutrient.name)).toEqual(['Protein', 'Fett'])
    })
  })
})
