import { describe, expect, it } from 'vitest'
import { useProfileCounts } from '@/composables/useProfileCounts'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'

describe('useProfileCounts', () => {
  describe('when loading counts', () => {
    it('counts reviews, products and lists', async () => {
      const counts = useProfileCounts(
        createFakeProfileGateway({
          countCurrentUserReviews: () => Promise.resolve(4),
          countUserProducts: () => Promise.resolve(3),
          countUserLists: () => Promise.resolve(2),
        }),
        { onlyPublicLists: false },
      )

      await counts.loadCounts('user-1')

      expect([
        counts.reviewsCount.value,
        counts.productsCount.value,
        counts.listsCount.value,
      ]).toEqual([4, 3, 2])
    })

    it('counts only public lists when asked to', async () => {
      const requested: boolean[] = []
      const counts = useProfileCounts(
        createFakeProfileGateway({
          countUserLists: (_userId, onlyPublic) => {
            requested.push(onlyPublic)
            return Promise.resolve(1)
          },
        }),
        { onlyPublicLists: true },
      )

      await counts.loadCounts('user-1')

      expect(requested).toEqual([true])
    })
  })

  describe('given counting fails', () => {
    it('reports the error', async () => {
      const counts = useProfileCounts(
        createFakeProfileGateway({ countUserLists: () => Promise.reject(new Error('offline')) }),
        { onlyPublicLists: false },
      )

      await counts.loadCounts('user-1')

      expect(counts.errorMessage.value).toBe('offline')
    })
  })
})
