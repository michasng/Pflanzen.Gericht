import { describe, expect, it, vi, beforeEach } from 'vitest'

const removeCalls: { bucket: string; paths: string[] }[] = []
const deleteCalls: { table: string; ids: string[] }[] = []

const productImageRows = [{ storage_path: 'user/product/image-a' }]
const reviewRows = [{ id: 'review-a' }]
const reviewImageRows = [{ storage_path: 'user/review-a/image-b' }]

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) =>
          Promise.resolve(
            table === 'product_image'
              ? { data: productImageRows, error: null }
              : table === 'review'
                ? { data: reviewRows, error: null }
                : { data: null, error: null },
          ),
        in: (_column: string, _values: string[]) =>
          Promise.resolve({ data: reviewImageRows, error: null }),
      }),
      delete: () => ({
        eq: (_column: string, value: string) => {
          deleteCalls.push({ table, ids: [value] })
          return Promise.resolve({ error: null })
        },
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        remove: (paths: string[]) => {
          removeCalls.push({ bucket, paths })
          return Promise.resolve({ error: null })
        },
      }),
    },
  },
}))

const { deleteProduct } = await import('../products')

describe('deleteProduct', () => {
  beforeEach(() => {
    removeCalls.length = 0
    deleteCalls.length = 0
  })

  it('removes product image and review image storage objects before deleting the product row', async () => {
    await deleteProduct('product-a')

    const productImageRemoval = removeCalls.find((call) => call.bucket === 'product-images')
    const reviewImageRemoval = removeCalls.find((call) => call.bucket === 'review-images')
    expect(productImageRemoval?.paths).toEqual(
      expect.arrayContaining([
        'user/product/image-a/thumbnail.webp',
        'user/product/image-a/preview.webp',
        'user/product/image-a/large.webp',
      ]),
    )
    expect(reviewImageRemoval?.paths).toEqual(
      expect.arrayContaining([
        'user/review-a/image-b/thumbnail.webp',
        'user/review-a/image-b/preview.webp',
        'user/review-a/image-b/large.webp',
      ]),
    )
    expect(deleteCalls).toEqual([{ table: 'product', ids: ['product-a'] }])
  })
})
