import { describe, expect, it } from 'vitest'
import { resolveMergedPriceReports } from '../resolveMergedPriceReports'
import type { PriceReport } from '@/types'

const buildReport = (overrides: Partial<PriceReport>): PriceReport => ({
  cityName: 'Berlin',
  createdAt: '2026-01-01T00:00:00Z',
  effectivePriceEuroCents: 100,
  id: 'report',
  observedAt: '2026-01-01',
  priceEuroCents: 100,
  productId: 'product-a',
  salePriceEuroCents: null,
  store: 'Rewe',
  userId: 'user-1',
  ...overrides,
})

describe('resolveMergedPriceReports', () => {
  describe('given a conflict on user, store and city', () => {
    it('keeps the report with the more recent observation', () => {
      const older = buildReport({ id: 'older', observedAt: '2026-01-01' })
      const newer = buildReport({ id: 'newer', observedAt: '2026-03-01', productId: 'product-b' })

      expect(resolveMergedPriceReports([newer, older]).map((r) => r.id)).toEqual(['newer'])
    })
  })

  describe('given reports differing in store or city', () => {
    it('keeps all of them', () => {
      const reports = [
        buildReport({ id: 'a' }),
        buildReport({ id: 'b', store: 'Edeka' }),
        buildReport({ id: 'c', cityName: 'Hamburg' }),
        buildReport({ id: 'd', userId: 'user-2' }),
      ]

      expect(resolveMergedPriceReports(reports)).toHaveLength(4)
    })
  })
})
