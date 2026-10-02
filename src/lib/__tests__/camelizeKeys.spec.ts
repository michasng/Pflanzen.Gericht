import { describe, expect, it } from 'vitest'
import { camelizeKeys } from '@/lib/camelizeKeys'

describe('camelizeKeys', () => {
  describe('given a flat row', () => {
    it('converts snake_case keys to camelCase', () => {
      const row = { min_price_euro_cents: 100, name: 'Tofu' }

      expect(camelizeKeys(row)).toEqual({ minPriceEuroCents: 100, name: 'Tofu' })
    })
  })

  describe('given nested rows and arrays', () => {
    it('converts keys at every level', () => {
      const rows = [{ product_image: [{ storage_path: 'a.png' }] }]

      expect(camelizeKeys(rows)).toEqual([{ productImage: [{ storagePath: 'a.png' }] }])
    })
  })

  describe('given primitive values', () => {
    it('returns null and scalars unchanged', () => {
      expect(camelizeKeys(null)).toBeNull()
      expect(camelizeKeys('is_organic')).toBe('is_organic')
    })
  })
})
