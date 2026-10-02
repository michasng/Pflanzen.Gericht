import { describe, expect, it } from 'vitest'
import { snakeifyKeys } from '@/lib/snakeifyKeys'

describe('snakeifyKeys', () => {
  describe('given a flat payload', () => {
    it('converts camelCase keys to snake_case', () => {
      const payload = { priceEuroCents: 100, store: 'Aldi' }

      expect(snakeifyKeys(payload)).toEqual({ price_euro_cents: 100, store: 'Aldi' })
    })
  })

  describe('given nested payloads and arrays', () => {
    it('converts keys at every level', () => {
      const payload = [{ productImage: [{ storagePath: 'a.png' }] }]

      expect(snakeifyKeys(payload)).toEqual([{ product_image: [{ storage_path: 'a.png' }] }])
    })
  })

  describe('given primitive values', () => {
    it('returns null and scalars unchanged', () => {
      expect(snakeifyKeys(null)).toBeNull()
      expect(snakeifyKeys('isOrganic')).toBe('isOrganic')
    })
  })
})
