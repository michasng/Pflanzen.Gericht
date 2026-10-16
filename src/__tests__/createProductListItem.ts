import type { ProductListItem } from '@/services/catalog'

export const createProductListItem = (id: string): ProductListItem => ({
  allergens: [],
  avgOverall: null,
  barcode: null,
  base: null,
  brand: 'Alpro',
  category: 'drink',
  createdAt: '2026-09-11T00:00:00.000Z',
  createdBy: 'user-1',
  description: null,
  energyJoules: null,
  id,
  images: [],
  isOrganic: false,
  minPriceEuroCents: null,
  name: `Product ${id}`,
  normalizedName: null,
  reviewsCount: 0,
  tags: [],
  updatedAt: '2026-09-11T00:00:00.000Z',
})
