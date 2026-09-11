import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  deleteImageVariants,
  from,
  reviewImageDelete,
  reviewImageDeleteEq,
  reviewStorageRemove,
  storageFrom,
} = vi.hoisted(() => {
  const reviewImageDeleteEq =
    vi.fn<(column: string, value: string) => Promise<{ error: Error | null }>>()
  const reviewImageDelete = vi.fn<() => { eq: typeof reviewImageDeleteEq }>(() => ({
    eq: reviewImageDeleteEq,
  }))
  const reviewStorageRemove = vi.fn<(paths: string[]) => Promise<{ error: Error | null }>>()
  const storageFrom = vi.fn<
    (bucket: string) => { remove: (paths: string[]) => Promise<{ error: Error | null }> }
  >((bucket) => {
    if (bucket !== 'review-images') throw new Error(`Unexpected bucket: ${bucket}`)
    return {
      remove: reviewStorageRemove,
    }
  })
  const from = vi.fn<(table: string) => unknown>((table) => {
    if (table !== 'review_image') throw new Error(`Unexpected table: ${table}`)
    return {
      delete: reviewImageDelete,
    }
  })
  const deleteImageVariants =
    vi.fn<
      (
        dependencies: { removeVariants: (paths: string[]) => Promise<void> },
        storagePaths: string[],
      ) => Promise<void>
    >()

  return {
    deleteImageVariants,
    from,
    reviewImageDelete,
    reviewImageDeleteEq,
    reviewStorageRemove,
    storageFrom,
  }
})

vi.mock('@/lib/imageVariantStorage', () => ({
  deleteImageVariants,
  persistImageVariants: vi.fn<() => unknown>(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from,
    storage: {
      from: storageFrom,
    },
  },
}))

import { deleteReviewImage } from '../reviews'

describe('deleteReviewImage', () => {
  beforeEach(() => {
    deleteImageVariants.mockReset()
    deleteImageVariants.mockResolvedValue(undefined)
    from.mockClear()
    reviewImageDelete.mockClear()
    reviewImageDeleteEq.mockReset()
    reviewImageDeleteEq.mockResolvedValue({ error: null })
    reviewStorageRemove.mockReset()
    reviewStorageRemove.mockResolvedValue({ error: null })
    storageFrom.mockClear()
  })

  describe('given an existing image row', () => {
    it('when deleting the image then it removes storage variants before deleting the metadata row', async () => {
      await deleteReviewImage('image-1', 'review/path')

      expect(deleteImageVariants).toHaveBeenCalledWith(
        expect.objectContaining({ removeVariants: expect.any(Function) }),
        ['review/path'],
      )
      expect(reviewImageDeleteEq).toHaveBeenCalledWith('id', 'image-1')

      const cleanupCallOrder = deleteImageVariants.mock.invocationCallOrder[0]
      const metadataDeleteCallOrder = reviewImageDeleteEq.mock.invocationCallOrder[0]
      expect(cleanupCallOrder).toBeDefined()
      expect(metadataDeleteCallOrder).toBeDefined()
      if (cleanupCallOrder === undefined || metadataDeleteCallOrder === undefined) {
        throw new Error('Expected call order entries')
      }
      expect(cleanupCallOrder).toBeLessThan(metadataDeleteCallOrder)

      const cleanupDependencies = deleteImageVariants.mock.calls[0]?.[0]
      expect(cleanupDependencies).toBeDefined()
      if (cleanupDependencies === undefined) throw new Error('Expected cleanup dependencies')

      await cleanupDependencies.removeVariants(['variant-path'])

      expect(storageFrom).toHaveBeenCalledWith('review-images')
      expect(reviewStorageRemove).toHaveBeenCalledWith(['variant-path'])
    })
  })

  describe('given removing storage variants fails', () => {
    it('when deleting the image then it does not delete the metadata row', async () => {
      const error = new Error('remove failed')
      deleteImageVariants.mockRejectedValueOnce(error)

      await expect(deleteReviewImage('image-1', 'review/path')).rejects.toThrow(error)

      expect(reviewImageDeleteEq).not.toHaveBeenCalled()
    })
  })
})
