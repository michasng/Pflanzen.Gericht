import { beforeEach, describe, expect, it, vi } from 'vitest'

const removedPaths: string[][] = []

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        copy: () => Promise.resolve({ error: null }),
        remove: (paths: string[]) => {
          removedPaths.push(paths)
          return Promise.resolve({ error: null })
        },
      }),
    },
  },
}))

const { copyStoredImageWithRecord } = await import('../copyStoredImageWithRecord')

const source = { bucketName: 'product-images', storagePath: 'user/source' }
const destination = { bucketName: 'review-images', storagePath: 'user/destination' }
const destinationVariantPaths = [
  'user/destination/thumbnail.webp',
  'user/destination/preview.webp',
  'user/destination/large.webp',
]

describe('copyStoredImageWithRecord', () => {
  beforeEach(() => {
    removedPaths.length = 0
  })

  describe('given the record is inserted', () => {
    it('returns the record and keeps the copied variants', async () => {
      const record = { id: 'record-a' }

      const result = await copyStoredImageWithRecord(
        source,
        destination,
        () => Promise.resolve({ data: record, error: null }),
        () => Promise.resolve({ data: null, error: null }),
      )

      expect(result).toBe(record)
      expect(removedPaths).toEqual([])
    })
  })

  describe('given the insert returns an error', () => {
    it('removes the copied variants and rethrows the error', async () => {
      const insertError = new Error('insert failed')

      const copy = copyStoredImageWithRecord(
        source,
        destination,
        () => Promise.resolve({ data: null, error: insertError }),
        () => Promise.resolve({ data: null, error: null }),
      )

      await expect(copy).rejects.toBe(insertError)
      expect(removedPaths).toEqual([expect.arrayContaining(destinationVariantPaths)])
    })
  })

  describe('given the insert returns neither record nor error', () => {
    it('removes the copied variants and throws a generic error', async () => {
      const copy = copyStoredImageWithRecord(
        source,
        destination,
        () => Promise.resolve({ data: null, error: null }),
        () => Promise.resolve({ data: null, error: null }),
      )

      await expect(copy).rejects.toThrow('Bild konnte nicht kopiert werden.')
      expect(removedPaths).toEqual([expect.arrayContaining(destinationVariantPaths)])
    })
  })

  describe('given the insert rejects', () => {
    it('removes the copied variants when no record exists', async () => {
      const rejection = new Error('network lost')

      const copy = copyStoredImageWithRecord(
        source,
        destination,
        () => Promise.reject(rejection),
        () => Promise.resolve({ data: null, error: null }),
      )

      await expect(copy).rejects.toBe(rejection)
      expect(removedPaths).toEqual([expect.arrayContaining(destinationVariantPaths)])
    })

    it('keeps the copied variants when the record was stored anyway', async () => {
      const rejection = new Error('network lost')

      const copy = copyStoredImageWithRecord(
        source,
        destination,
        () => Promise.reject(rejection),
        () => Promise.resolve({ data: { id: 'record-a' }, error: null }),
      )

      await expect(copy).rejects.toBe(rejection)
      expect(removedPaths).toEqual([])
    })

    it('keeps the copied variants when the lookup fails', async () => {
      const rejection = new Error('network lost')

      const copy = copyStoredImageWithRecord(
        source,
        destination,
        () => Promise.reject(rejection),
        () => Promise.resolve({ data: null, error: new Error('lookup failed') }),
      )

      await expect(copy).rejects.toBe(rejection)
      expect(removedPaths).toEqual([])
    })
  })
})
