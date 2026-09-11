import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  deleteImageVariants,
  from,
  productDelete,
  productDeleteEq,
  productDeleteSelect,
  productImageEq,
  productImagePages,
  productImageRange,
  productStorageRemove,
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

  const productDeleteSelect =
    vi.fn<
      (
        column: string,
        value: string,
        selection: string,
      ) => Promise<{ data: { id: string }[] | null; error: Error | null }>
    >()
  const productDeleteEq = vi.fn<
    (
      column: string,
      value: string,
    ) => { select: (selection: string) => ReturnType<typeof productDeleteSelect> }
  >((column, value) => ({
    select: (selection) => productDeleteSelect(column, value, selection),
  }))
  const productDelete = vi.fn<() => { eq: typeof productDeleteEq }>(() => ({
    eq: productDeleteEq,
  }))
  const productStorageRemove = vi.fn<(paths: string[]) => Promise<{ error: Error | null }>>()
  const reviewStorageRemove = vi.fn<(paths: string[]) => Promise<{ error: Error | null }>>()
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
    productDelete,
    productDeleteEq,
    productDeleteSelect,
    productImageEq,
    productImagePages,
    productImageRange,
    productStorageRemove,
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
    productDelete.mockClear()
    productDeleteEq.mockClear()
    productDeleteSelect.mockReset()
    productDeleteSelect.mockResolvedValue({ data: [{ id: 'product-1' }], error: null })
    productImageEq.mockClear()
    productImagePages.clear()
    productImageRange.mockClear()
    productStorageRemove.mockReset()
    productStorageRemove.mockResolvedValue({ error: null })
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
      expect(productDeleteSelect).toHaveBeenCalledWith('id', 'product-1', 'id')

      const lastCleanupCallOrder =
        deleteImageVariants.mock.invocationCallOrder[
          deleteImageVariants.mock.invocationCallOrder.length - 1
        ]
      const productDeleteCallOrder = productDeleteSelect.mock.invocationCallOrder[0]
      expect(lastCleanupCallOrder).toBeDefined()
      expect(productDeleteCallOrder).toBeDefined()
      if (lastCleanupCallOrder === undefined) throw new Error('Expected cleanup call order')
      if (productDeleteCallOrder === undefined)
        throw new Error('Expected product delete call order')
      expect(lastCleanupCallOrder).toBeLessThan(productDeleteCallOrder)

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
    it('when deleting a product then it deletes only the product row', async () => {
      setProductImagePage('product-1', 0, 999, [])
      setReviewImagePage('product-1', 0, 999, [])

      await deleteProductService('product-1')

      expect(deleteImageVariants).not.toHaveBeenCalled()
      expect(productDeleteEq).toHaveBeenCalledWith('id', 'product-1')
      expect(productDeleteSelect).toHaveBeenCalledWith('id', 'product-1', 'id')
    })
  })

  describe('given loading product images fails', () => {
    it('when deleting a product then it rethrows the error', async () => {
      const error = new Error('load product images failed')
      setProductImagePage('product-1', 0, 999, [], error)
      setReviewImagePage('product-1', 0, 999, [])

      await expect(deleteProductService('product-1')).rejects.toThrow(error)

      expect(deleteImageVariants).not.toHaveBeenCalled()
      expect(productDeleteEq).not.toHaveBeenCalled()
      expect(productDeleteSelect).not.toHaveBeenCalled()
    })
  })

  describe('given removing image variants fails', () => {
    it('when deleting a product then it rethrows the error', async () => {
      const error = new Error('remove variants failed')
      setProductImagePage('product-1', 0, 999, [{ storage_path: 'product-image-1' }])
      setReviewImagePage('product-1', 0, 999, [])
      deleteImageVariants.mockRejectedValueOnce(error)

      await expect(deleteProductService('product-1')).rejects.toThrow(error)
      expect(productDeleteEq).not.toHaveBeenCalled()
      expect(productDeleteSelect).not.toHaveBeenCalled()
      expect(productDeleteSelect).not.toHaveBeenCalled()
    })
  })

  describe('given deleting the product row fails', () => {
    it('when deleting a product then it rethrows the database error', async () => {
      const error = new Error('delete failed')
      setProductImagePage('product-1', 0, 999, [])
      setReviewImagePage('product-1', 0, 999, [])
      productDeleteSelect.mockResolvedValueOnce({ data: null, error })

      await expect(deleteProductService('product-1')).rejects.toThrow(error)
    })
  })

  describe('given the product row is not deleted', () => {
    it('when deleting a product then it throws a delete failure error', async () => {
      setProductImagePage('product-1', 0, 999, [])
      setReviewImagePage('product-1', 0, 999, [])
      productDeleteSelect.mockResolvedValueOnce({ data: [], error: null })

      await expect(deleteProductService('product-1')).rejects.toThrow(
        'Product could not be deleted',
      )
    })
  })
})
