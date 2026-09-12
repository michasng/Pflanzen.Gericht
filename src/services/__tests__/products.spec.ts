import { describe, expect, it, vi, beforeEach } from 'vitest'

const removeCalls: { bucket: string; paths: string[] }[] = []
const deleteCalls: { table: string; ids: string[] }[] = []

const currentUser = { id: 'owner-user' }
const productImageRows = [{ storage_path: 'user/product/image-a' }]
const reviewRows = [{ id: 'review-a' }]
const reviewImageRows = [{ storage_path: 'user/review-a/image-b' }]
let productRow: { created_by: string } | null = { created_by: currentUser.id }
let profileRow = { is_admin: false }
let signedInUserId: string | null = currentUser.id

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => {
          if (table === 'product_image')
            return Promise.resolve({ data: productImageRows, error: null })
          if (table === 'review') return Promise.resolve({ data: reviewRows, error: null })
          if (table === 'product') {
            return {
              maybeSingle: () => Promise.resolve({ data: productRow, error: null }),
            }
          }
          if (table === 'profile') {
            return {
              single: () => Promise.resolve({ data: profileRow, error: null }),
            }
          }
          return Promise.resolve({ data: null, error: null })
        },
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
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: signedInUserId ? { id: signedInUserId } : null },
          error: null,
        }),
    },
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
    productRow = { created_by: currentUser.id }
    profileRow = { is_admin: false }
    signedInUserId = currentUser.id
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

  it('rejects before storage cleanup when the signed-in user cannot delete the product', async () => {
    signedInUserId = 'review-user'
    productRow = { created_by: 'product-owner' }

    await expect(deleteProduct('product-a')).rejects.toThrow(
      'Not authorized to delete this product.',
    )
    expect(removeCalls).toEqual([])
    expect(deleteCalls).toEqual([])
  })

  it('allows admins to clean up storage before deleting the product row', async () => {
    signedInUserId = 'admin-user'
    productRow = { created_by: 'product-owner' }
    profileRow = { is_admin: true }

    await deleteProduct('product-a')

    expect(removeCalls).toHaveLength(2)
    expect(deleteCalls).toEqual([{ table: 'product', ids: ['product-a'] }])
  })

  it('returns without cleanup when the product no longer exists', async () => {
    productRow = null

    await expect(deleteProduct('product-a')).resolves.toBeUndefined()

    expect(removeCalls).toEqual([])
    expect(deleteCalls).toEqual([])
  })
})
