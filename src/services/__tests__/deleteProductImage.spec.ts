import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  deleteImageVariants,
  from,
  productImageDelete,
  productImageDeleteEq,
  productStorageRemove,
  storageFrom,
} = vi.hoisted(() => {
  const productImageDeleteEq =
    vi.fn<(column: string, value: string) => Promise<{ error: Error | null }>>()
  const productImageDelete = vi.fn<() => { eq: typeof productImageDeleteEq }>(() => ({
    eq: productImageDeleteEq,
  }))
  const productStorageRemove = vi.fn<(paths: string[]) => Promise<{ error: Error | null }>>()
  const storageFrom = vi.fn<
    (bucket: string) => { remove: (paths: string[]) => Promise<{ error: Error | null }> }
  >((bucket) => {
    if (bucket !== 'product-images') throw new Error(`Unexpected bucket: ${bucket}`)
    return {
      remove: productStorageRemove,
    }
  })
  const from = vi.fn<(table: string) => unknown>((table) => {
    if (table !== 'product_image') throw new Error(`Unexpected table: ${table}`)
    return {
      delete: productImageDelete,
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
    productImageDelete,
    productImageDeleteEq,
    productStorageRemove,
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

import { deleteProductImage } from '../products'

describe('deleteProductImage', () => {
  beforeEach(() => {
    deleteImageVariants.mockReset()
    deleteImageVariants.mockResolvedValue(undefined)
    from.mockClear()
    productImageDelete.mockClear()
    productImageDeleteEq.mockReset()
    productImageDeleteEq.mockResolvedValue({ error: null })
    productStorageRemove.mockReset()
    productStorageRemove.mockResolvedValue({ error: null })
    storageFrom.mockClear()
  })

  describe('given an existing image row', () => {
    it('when deleting the image then it removes storage variants before deleting the metadata row', async () => {
      await deleteProductImage('image-1', 'product/path')

      expect(deleteImageVariants).toHaveBeenCalledWith(
        expect.objectContaining({ removeVariants: expect.any(Function) }),
        ['product/path'],
      )
      expect(productImageDeleteEq).toHaveBeenCalledWith('id', 'image-1')

      const cleanupCallOrder = deleteImageVariants.mock.invocationCallOrder[0]
      const metadataDeleteCallOrder = productImageDeleteEq.mock.invocationCallOrder[0]
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

      expect(storageFrom).toHaveBeenCalledWith('product-images')
      expect(productStorageRemove).toHaveBeenCalledWith(['variant-path'])
    })
  })

  describe('given removing storage variants fails', () => {
    it('when deleting the image then it does not delete the metadata row', async () => {
      const error = new Error('remove failed')
      deleteImageVariants.mockRejectedValueOnce(error)

      await expect(deleteProductImage('image-1', 'product/path')).rejects.toThrow(error)

      expect(productImageDeleteEq).not.toHaveBeenCalled()
    })
  })
})
