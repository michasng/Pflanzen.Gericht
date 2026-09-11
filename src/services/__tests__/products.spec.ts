import { beforeEach, describe, expect, it, vi } from 'vitest'

const { deleteEq, deleteProduct, from } = vi.hoisted(() => {
  const deleteEq = vi.fn<(column: string, value: string) => Promise<{ error: Error | null }>>()
  const deleteProduct = vi.fn<() => { eq: typeof deleteEq }>(() => ({ eq: deleteEq }))
  const from = vi.fn<(table: string) => { delete: typeof deleteProduct }>((table: string) => {
    if (table === 'product') {
      return {
        delete: deleteProduct,
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    deleteEq,
    deleteProduct,
    from,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from,
  },
}))

import { deleteProduct as deleteProductService } from '../products'

describe('deleteProduct', () => {
  beforeEach(() => {
    deleteEq.mockReset()
    deleteProduct.mockClear()
    from.mockClear()
  })

  describe('given the delete succeeds', () => {
    it('when deleting a product then it removes the product row by id', async () => {
      deleteEq.mockResolvedValue({ error: null })

      await deleteProductService('product-1')

      expect(from).toHaveBeenCalledWith('product')
      expect(deleteProduct).toHaveBeenCalledOnce()
      expect(deleteEq).toHaveBeenCalledWith('id', 'product-1')
    })
  })

  describe('given the delete fails', () => {
    it('when deleting a product then it rethrows the database error', async () => {
      const error = new Error('delete failed')
      deleteEq.mockResolvedValue({ error })

      await expect(deleteProductService('product-1')).rejects.toThrow(error)
    })
  })
})
