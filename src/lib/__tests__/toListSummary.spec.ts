import { describe, expect, it } from 'vitest'
import { ImageBucket } from '@/config/imageBucket'
import { ListVisibility } from '@/config/ListVisibility'
import { toListSummary } from '@/lib/toListSummary'
import type { CamelCasedKeys } from '@/lib/CamelCasedKeys'
import type { Tables } from '@/types/database'

const createRow = (
  overrides: Partial<CamelCasedKeys<Tables<'list_summary'>>> = {},
): CamelCasedKeys<Tables<'list_summary'>> => ({
  id: 'list-1',
  ownerId: 'user-1',
  name: 'Favoriten',
  visibility: 'private',
  productCount: 3,
  coverStoragePath: 'cover.jpg',
  sortName: 'Favoriten',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('toListSummary', () => {
  describe('given a complete row', () => {
    it('describes the list with its product cover image', () => {
      expect(toListSummary(createRow())).toEqual({
        id: 'list-1',
        ownerId: 'user-1',
        name: 'Favoriten',
        visibility: ListVisibility.Private,
        productCount: 3,
        coverImage: { bucket: ImageBucket.Product, storagePath: 'cover.jpg' },
      })
    })

    it('maps public visibility', () => {
      expect(toListSummary(createRow({ visibility: 'public' })).visibility).toBe(
        ListVisibility.Public,
      )
    })
  })

  describe('given the list has no cover image', () => {
    it('has no cover image', () => {
      expect(toListSummary(createRow({ coverStoragePath: null })).coverImage).toBeNull()
    })
  })

  describe('given a required column is missing', () => {
    it('throws', () => {
      expect(() => toListSummary(createRow({ name: null }))).toThrow(
        'Die Liste konnte nicht gelesen werden.',
      )
    })
  })
})
