import { describe, expect, it } from 'vitest'
import { loadMergeSource, UNKNOWN_OWNER_NAME } from '@/services/loadMergeSource'
import { createFakeProductEditingGateway } from '@/__tests__/createFakeProductEditingGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createProfile } from '@/__tests__/createProfile'

describe('loadMergeSource', () => {
  describe('given the product does not exist', () => {
    it('fails with a not found message', async () => {
      const gateway = createFakeProductEditingGateway({ fetchProduct: () => Promise.resolve(null) })

      await expect(loadMergeSource(gateway, 'product-1')).rejects.toThrow('Produkt nicht gefunden.')
    })
  })

  describe('given the product exists', () => {
    it('returns the product, its form values and its activity counts', async () => {
      const product = createProduct({ name: 'Hafermilch' })
      const counts = { reviewsCount: 2, priceReportsCount: 3, similarityVotesCount: 4 }
      const gateway = createFakeProductEditingGateway({
        fetchProduct: () => Promise.resolve(product),
        fetchProductActivityCounts: () => Promise.resolve(counts),
      })

      const source = await loadMergeSource(gateway, product.id)

      expect(source).toMatchObject({ product, ...counts, values: { name: 'Hafermilch' } })
    })

    it('names the owner by display name before username', async () => {
      const gateway = createFakeProductEditingGateway({
        fetchProduct: () => Promise.resolve(createProduct()),
        fetchPublicProfile: () =>
          Promise.resolve(createProfile({ displayName: 'Anna', username: 'anna1' })),
      })

      const source = await loadMergeSource(gateway, 'product-1')

      expect(source.ownerName).toBe('Anna')
    })

    it('falls back to the username when there is no display name', async () => {
      const gateway = createFakeProductEditingGateway({
        fetchProduct: () => Promise.resolve(createProduct()),
        fetchPublicProfile: () => Promise.resolve(createProfile({ username: 'anna1' })),
      })

      const source = await loadMergeSource(gateway, 'product-1')

      expect(source.ownerName).toBe('anna1')
    })

    it('names an owner without a profile as unknown', async () => {
      const gateway = createFakeProductEditingGateway({
        fetchProduct: () => Promise.resolve(createProduct()),
      })

      const source = await loadMergeSource(gateway, 'product-1')

      expect(source.ownerName).toBe(UNKNOWN_OWNER_NAME)
    })
  })
})
