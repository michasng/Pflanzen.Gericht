import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  deleteImageVariants,
  from,
  pendingDelete,
  pendingDeleteEq,
  pendingInsert,
  productDelete,
  productDeleteEq,
  productStorageRemove,
  productImageEq,
  productImagePages,
  productImageRange,
  reviewImageEq,
  reviewImagePages,
  reviewImageRange,
  reviewStorageRemove,
  storageFrom,
} = vi.hoisted(() => {
  const productImagePages = new Map<
    string,
    { error: Error | null; rows: { storage_path: string }[] }
  >()
  const reviewImagePages = new Map<
    string,
    { error: Error | null; rows: { storage_path: string }[] }
  >()

  const pendingDeleteEq =
    vi.fn<(column: string, value: string) => Promise<{ error: Error | null }>>()
  const pendingDelete = vi.fn<() => { eq: typeof pendingDeleteEq }>(() => ({
    eq: pendingDeleteEq,
  }))
  const pendingInsert =
    vi.fn<(values: { product_id: string }) => Promise<{ error: Error | null }>>()
  const productDeleteEq =
    vi.fn<(column: string, value: string) => Promise<{ error: Error | null }>>()
  const productDelete = vi.fn<() => { eq: typeof productDeleteEq }>(() => ({
    eq: productDeleteEq,
  }))
  const productStorageRemove = vi.fn<(paths: string[]) => Promise<{ error: Error | null }>>()
  const productImageRange = vi.fn<
    (
      column: string,
      value: string,
      fromIndex: number,
      toIndex: number,
    ) => Promise<{ data: { storage_path: string }[]; error: Error | null }>
  >((column, value, fromIndex, toIndex) => {
    const page = productImagePages.get(`${column}|${value}|${fromIndex}|${toIndex}`)
    return Promise.resolve({ data: page?.rows ?? [], error: page?.error ?? null })
  })
  const reviewImageRange = vi.fn<
    (
      column: string,
      value: string,
      fromIndex: number,
      toIndex: number,
    ) => Promise<{ data: { storage_path: string }[]; error: Error | null }>
  >((column, value, fromIndex, toIndex) => {
    const page = reviewImagePages.get(`${column}|${value}|${fromIndex}|${toIndex}`)
    return Promise.resolve({ data: page?.rows ?? [], error: page?.error ?? null })
  })
  const reviewStorageRemove = vi.fn<(paths: string[]) => Promise<{ error: Error | null }>>()
  const productImageEq = vi.fn<
    (
      column: string,
      value: string,
    ) => { range: (fromIndex: number, toIndex: number) => ReturnType<typeof productImageRange> }
  >((column, value) => ({
    range: (fromIndex, toIndex) => productImageRange(column, value, fromIndex, toIndex),
  }))
  const reviewImageEq = vi.fn<
    (
      column: string,
      value: string,
    ) => { range: (fromIndex: number, toIndex: number) => ReturnType<typeof reviewImageRange> }
  >((column, value) => ({
    range: (fromIndex, toIndex) => reviewImageRange(column, value, fromIndex, toIndex),
  }))
  const storageFrom = vi.fn<
    (bucket: string) => { remove: (paths: string[]) => Promise<{ error: Error | null }> }
  >((bucket) => {
    if (bucket === 'product-images') {
      return {
        remove: productStorageRemove,
      }
    }

    if (bucket === 'review-images') {
      return {
        remove: reviewStorageRemove,
      }
    }

    throw new Error(`Unexpected bucket: ${bucket}`)
  })
  const from = vi.fn<(table: string) => unknown>((table) => {
    if (table === 'pending_product_deletion') {
      return {
        delete: pendingDelete,
        insert: pendingInsert,
      }
    }

    if (table === 'product') {
      return {
        delete: productDelete,
      }
    }

    if (table === 'product_image') {
      return {
        select: () => ({
          eq: productImageEq,
        }),
      }
    }

    if (table === 'review_image') {
      return {
        select: () => ({
          eq: reviewImageEq,
        }),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
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
    pendingDelete,
    pendingDeleteEq,
    pendingInsert,
    productDelete,
    productDeleteEq,
    productStorageRemove,
    productImageEq,
    productImagePages,
    productImageRange,
    reviewImageEq,
    reviewImagePages,
    reviewImageRange,
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

import { deleteProduct as deleteProductService } from '../products'

const createStorageRows = (count: number, prefix: string): { storage_path: string }[] =>
  Array.from({ length: count }, (_, index) => ({
    storage_path: `${prefix}-${index + 1}`,
  }))

const setProductImagePage = (
  productId: string,
  fromIndex: number,
  toIndex: number,
  rows: { storage_path: string }[],
  error: Error | null = null,
): void => {
  productImagePages.set(`product_id|${productId}|${fromIndex}|${toIndex}`, { error, rows })
}

const setReviewImagePage = (
  productId: string,
  fromIndex: number,
  toIndex: number,
  rows: { storage_path: string }[],
  error: Error | null = null,
): void => {
  reviewImagePages.set(`review.product_id|${productId}|${fromIndex}|${toIndex}`, { error, rows })
}

describe('deleteProduct', () => {
  beforeEach(() => {
    deleteImageVariants.mockReset()
    deleteImageVariants.mockResolvedValue(undefined)
    from.mockClear()
    pendingDelete.mockClear()
    pendingDeleteEq.mockReset()
    pendingDeleteEq.mockResolvedValue({ error: null })
    pendingInsert.mockReset()
    pendingInsert.mockResolvedValue({ error: null })
    productDelete.mockClear()
    productDeleteEq.mockReset()
    productDeleteEq.mockResolvedValue({ error: null })
    productStorageRemove.mockReset()
    productStorageRemove.mockResolvedValue({ error: null })
    productImageEq.mockClear()
    productImagePages.clear()
    productImageRange.mockClear()
    reviewImageEq.mockClear()
    reviewImagePages.clear()
    reviewImageRange.mockClear()
    reviewStorageRemove.mockReset()
    reviewStorageRemove.mockResolvedValue({ error: null })
    storageFrom.mockClear()
  })

  describe('given dependent storage images exist across multiple pages', () => {
    it('when deleting a product then it removes product and review images before deleting the product row', async () => {
      const expectedProductImagePaths = [
        ...createStorageRows(1000, 'product-image').map((row) => row.storage_path),
        'product-image-tail-1',
      ]
      const expectedReviewImagePaths = [
        ...createStorageRows(1000, 'review-image').map((row) => row.storage_path),
        'review-image-tail-1',
      ]

      setProductImagePage('product-1', 0, 999, createStorageRows(1000, 'product-image'))
      setProductImagePage('product-1', 1000, 1999, [{ storage_path: 'product-image-tail-1' }])
      setReviewImagePage('product-1', 0, 999, createStorageRows(1000, 'review-image'))
      setReviewImagePage('product-1', 1000, 1999, [{ storage_path: 'review-image-tail-1' }])

      await deleteProductService('product-1')

      expect(pendingInsert).toHaveBeenCalledWith({ product_id: 'product-1' })
      expect(productImageEq).toHaveBeenCalledWith('product_id', 'product-1')
      expect(productImageRange).toHaveBeenCalledWith('product_id', 'product-1', 0, 999)
      expect(productImageRange).toHaveBeenCalledWith('product_id', 'product-1', 1000, 1999)
      expect(reviewImageEq).toHaveBeenCalledWith('review.product_id', 'product-1')
      expect(reviewImageRange).toHaveBeenCalledWith('review.product_id', 'product-1', 0, 999)
      expect(reviewImageRange).toHaveBeenCalledWith('review.product_id', 'product-1', 1000, 1999)
      expect(deleteImageVariants).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ removeVariants: expect.any(Function) }),
        expectedProductImagePaths,
      )
      expect(deleteImageVariants).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ removeVariants: expect.any(Function) }),
        expectedReviewImagePaths,
      )
      expect(productDelete).toHaveBeenCalledOnce()
      expect(productDeleteEq).toHaveBeenCalledWith('id', 'product-1')

      const lastCleanupCallOrder =
        deleteImageVariants.mock.invocationCallOrder[
          deleteImageVariants.mock.invocationCallOrder.length - 1
        ]
      const productDeleteCallOrder = productDeleteEq.mock.invocationCallOrder[0]
      expect(lastCleanupCallOrder).toBeDefined()
      expect(productDeleteCallOrder).toBeDefined()
      if (lastCleanupCallOrder === undefined) throw new Error('Expected cleanup call order')
      if (productDeleteCallOrder === undefined)
        throw new Error('Expected product delete call order')
      expect(lastCleanupCallOrder).toBeLessThan(productDeleteCallOrder)
      expect(pendingDeleteEq).not.toHaveBeenCalled()

      const productCleanupDependencies = deleteImageVariants.mock.calls[0]?.[0]
      const reviewCleanupDependencies = deleteImageVariants.mock.calls[1]?.[0]
      expect(productCleanupDependencies).toBeDefined()
      expect(reviewCleanupDependencies).toBeDefined()
      if (productCleanupDependencies === undefined || reviewCleanupDependencies === undefined) {
        throw new Error('Expected cleanup dependencies')
      }

      await productCleanupDependencies.removeVariants(['product-path'])
      await reviewCleanupDependencies.removeVariants(['review-path'])

      expect(storageFrom).toHaveBeenCalledWith('product-images')
      expect(storageFrom).toHaveBeenCalledWith('review-images')
      expect(productStorageRemove).toHaveBeenCalledWith(['product-path'])
      expect(reviewStorageRemove).toHaveBeenCalledWith(['review-path'])
    })
  })

  describe('given no dependent storage images exist', () => {
    it('when deleting a product then it deletes only the product row after starting the deletion state', async () => {
      setProductImagePage('product-1', 0, 999, [])
      setReviewImagePage('product-1', 0, 999, [])

      await deleteProductService('product-1')

      expect(pendingInsert).toHaveBeenCalledWith({ product_id: 'product-1' })
      expect(deleteImageVariants).not.toHaveBeenCalled()
      expect(productDeleteEq).toHaveBeenCalledWith('id', 'product-1')
      expect(pendingDeleteEq).not.toHaveBeenCalled()
    })
  })

  describe('given a previous delete attempt already created the deletion lock', () => {
    it('when deleting the same product again then it continues the cleanup and delete flow', async () => {
      const duplicateLockError = Object.assign(
        new Error('duplicate key value violates unique constraint "pending_product_deletion_pkey"'),
        { code: '23505' },
      )
      pendingInsert.mockResolvedValueOnce({ error: duplicateLockError })
      setProductImagePage('product-1', 0, 999, [])
      setReviewImagePage('product-1', 0, 999, [])

      await deleteProductService('product-1')

      expect(pendingInsert).toHaveBeenCalledWith({ product_id: 'product-1' })
      expect(productDeleteEq).toHaveBeenCalledWith('id', 'product-1')
      expect(pendingDeleteEq).not.toHaveBeenCalled()
    })
  })

  describe('given loading product images fails', () => {
    it('when deleting a product then it clears the deletion state and rethrows the error', async () => {
      const error = new Error('load product images failed')
      setProductImagePage('product-1', 0, 999, [], error)
      setReviewImagePage('product-1', 0, 999, [])

      await expect(deleteProductService('product-1')).rejects.toThrow(error)

      expect(deleteImageVariants).not.toHaveBeenCalled()
      expect(productDeleteEq).not.toHaveBeenCalled()
      expect(pendingDeleteEq).toHaveBeenCalledWith('product_id', 'product-1')
    })
  })

  describe('given removing image variants fails', () => {
    it('when deleting a product then it clears the deletion state and rethrows the error', async () => {
      const error = new Error('remove variants failed')
      setProductImagePage('product-1', 0, 999, [{ storage_path: 'product-image-1' }])
      setReviewImagePage('product-1', 0, 999, [])
      deleteImageVariants.mockRejectedValueOnce(error)

      await expect(deleteProductService('product-1')).rejects.toThrow(error)

      expect(productDeleteEq).not.toHaveBeenCalled()
      expect(pendingDeleteEq).toHaveBeenCalledWith('product_id', 'product-1')
    })
  })

  describe('given deleting the product row fails', () => {
    it('when deleting a product then it clears the deletion state and rethrows the database error', async () => {
      const error = new Error('delete failed')
      setProductImagePage('product-1', 0, 999, [])
      setReviewImagePage('product-1', 0, 999, [])
      productDeleteEq.mockResolvedValueOnce({ error })

      await expect(deleteProductService('product-1')).rejects.toThrow(error)

      expect(pendingDeleteEq).toHaveBeenCalledWith('product_id', 'product-1')
    })
  })
})
