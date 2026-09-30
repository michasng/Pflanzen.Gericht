import { describe, expect, it } from 'vitest'
import { resolveMergedPriceReports } from '../resolveMergedPriceReports'
import type { PriceReport } from '@/types'

const buildReport = (overrides: Partial<PriceReport>): PriceReport => ({
  city_name: 'Berlin',
  created_at: '2026-01-01T00:00:00Z',
  effective_price_euro_cents: 100,
  id: 'report',
  observed_at: '2026-01-01',
  price_euro_cents: 100,
  product_id: 'product-a',
  sale_price_euro_cents: null,
  store: 'Rewe',
  user_id: 'user-1',
  ...overrides,
})

describe('resolveMergedPriceReports', () => {
  describe('given a conflict on user, store and city', () => {
    it('keeps the report with the more recent observation', () => {
      const older = buildReport({ id: 'older', observed_at: '2026-01-01' })
      const newer = buildReport({ id: 'newer', observed_at: '2026-03-01', product_id: 'product-b' })

      expect(resolveMergedPriceReports([newer, older]).map((r) => r.id)).toEqual(['newer'])
    })
  })

  describe('given reports differing in store or city', () => {
    it('keeps all of them', () => {
      const reports = [
        buildReport({ id: 'a' }),
        buildReport({ id: 'b', store: 'Edeka' }),
        buildReport({ id: 'c', city_name: 'Hamburg' }),
        buildReport({ id: 'd', user_id: 'user-2' }),
      ]

      expect(resolveMergedPriceReports(reports)).toHaveLength(4)
    })
  })
})
