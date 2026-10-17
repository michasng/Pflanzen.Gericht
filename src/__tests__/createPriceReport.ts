import type { PriceReportWithProfile } from '@/services/prices'

export const createPriceReport = (
  overrides: Partial<PriceReportWithProfile> = {},
): PriceReportWithProfile => ({
  id: 'report-1',
  productId: 'product-1',
  userId: 'user-1',
  store: 'Rewe',
  cityName: 'Berlin',
  priceEuroCents: 199,
  salePriceEuroCents: null,
  effectivePriceEuroCents: 199,
  observedAt: '2026-09-11',
  createdAt: '2026-09-11T00:00:00.000Z',
  profile: { username: 'user', displayName: null },
  ...overrides,
})
