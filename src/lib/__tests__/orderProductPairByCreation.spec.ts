import { describe, expect, it } from 'vitest'
import { orderProductPairByCreation } from '../orderProductPairByCreation'

describe('orderProductPairByCreation', () => {
  describe('given the later product first', () => {
    it('returns the earlier product first', () => {
      const earlier = { created_at: '2026-01-01T00:00:00Z' }
      const later = { created_at: '2026-02-01T00:00:00Z' }

      expect(orderProductPairByCreation(later, earlier)).toEqual([earlier, later])
    })
  })
})
