import { describe, expect, it } from 'vitest'
import { QuantityUnit } from '@pflanzen-gericht/contracts'
import { buildCrawledProduct } from '../../shared/crawling/__tests__/buildCrawledProduct.js'
import { resolveRequiredProductFields } from '../resolveRequiredProductFields.js'

const completeProduct = {
  ...buildCrawledProduct('https://example.test/a'),
  category: 'meat' as const,
}

describe('resolveRequiredProductFields', () => {
  describe('given all required fields', () => {
    it('returns them', () => {
      expect(resolveRequiredProductFields(completeProduct)).toEqual({
        category: 'meat',
        brand: 'Brand',
        quantityUnit: QuantityUnit.Gram,
        quantityValue: 200,
      })
    })
  })

  describe.each([
    { missingFieldName: 'category', product: { ...completeProduct, category: null } },
    { missingFieldName: 'brand', product: { ...completeProduct, brand: null } },
    { missingFieldName: 'quantity unit', product: { ...completeProduct, quantityUnit: null } },
    { missingFieldName: 'quantity value', product: { ...completeProduct, quantityValue: null } },
  ])('given no $missingFieldName', ({ product }) => {
    it('returns null', () => {
      expect(resolveRequiredProductFields(product)).toBeNull()
    })
  })
})
