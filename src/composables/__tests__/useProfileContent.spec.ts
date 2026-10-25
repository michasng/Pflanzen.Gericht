import { describe, expect, it } from 'vitest'
import { createFakeProfileGateway } from '@/__tests__/createFakeProfileGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { createProductWithImages } from '@/__tests__/createProductWithImages'
import { createReviewWithMeta } from '@/__tests__/createReviewWithMeta'
import { useProfileContent } from '@/composables/useProfileContent'
import { ProfileAudience } from '@/config/ProfileAudience'
import { PROFILE_PAGE_SIZE } from '@/config/profilePageSize'
import type { ProfileGateway } from '@/services/ProfileGateway'

const USER_ID = 'user-1'

const createContent = (
  gateway: Partial<ProfileGateway> = {},
  audience = ProfileAudience.Visitor,
  userId: string | null = USER_ID,
) =>
  useProfileContent({
    gateway: createFakeProfileGateway(gateway),
    userId: () => userId ?? undefined,
    audience,
  })

describe('useProfileContent', () => {
  describe('when loading the first pages', () => {
    it('loads reviews, products and lists of the user', async () => {
      const review = createReviewWithMeta({ id: 'review-1' })
      const product = createProductWithImages({ id: 'product-1' })
      const list = createListSummary({ id: 'list-1' })
      const content = createContent({
        fetchUserReviews: () => Promise.resolve([review]),
        fetchUserProducts: () => Promise.resolve([product]),
        fetchUserLists: () => Promise.resolve([list]),
      })

      await content.loadFirstPages()

      expect(content.reviews.items.value).toEqual([review])
      expect(content.products.items.value).toEqual([product])
      expect(content.lists.items.value).toEqual([list])
    })

    it('requests only the first page of the configured size', async () => {
      const requests: unknown[] = []
      const content = createContent({
        fetchUserProducts: (userId, request) => {
          requests.push([userId, request])
          return Promise.resolve([])
        },
      })

      await content.loadFirstPages()

      expect(requests).toEqual([[USER_ID, { page: 0, pageSize: PROFILE_PAGE_SIZE }]])
    })

    it('requests nothing without a user', async () => {
      const requests: unknown[] = []
      const content = createContent(
        {
          fetchUserReviews: () => {
            requests.push('reviews')
            return Promise.resolve([])
          },
        },
        ProfileAudience.Owner,
        null,
      )

      await content.loadFirstPages()

      expect(requests).toEqual([])
    })

    it('reports the first failure of any list', async () => {
      const content = createContent({
        fetchUserLists: () => Promise.reject(new Error('offline')),
      })

      await content.loadFirstPages()

      expect(content.loadError.value).toBe('offline')
    })
  })

  describe('given the owner views the profile', () => {
    it('includes outdated reviews and private lists', async () => {
      const requests: unknown[] = []
      const content = createContent(
        {
          fetchUserReviews: (_userId, request) => {
            requests.push(request)
            return Promise.resolve([])
          },
          fetchUserLists: (_userId, request) => {
            requests.push(request)
            return Promise.resolve([])
          },
        },
        ProfileAudience.Owner,
      )

      await content.loadFirstPages()

      expect(requests).toEqual([
        { page: 0, pageSize: PROFILE_PAGE_SIZE, onlyCurrent: false },
        { page: 0, pageSize: PROFILE_PAGE_SIZE, onlyPublic: false },
      ])
    })
  })

  describe('given a visitor views the profile', () => {
    it('only includes current reviews and public lists', async () => {
      const requests: unknown[] = []
      const content = createContent({
        fetchUserReviews: (_userId, request) => {
          requests.push(request)
          return Promise.resolve([])
        },
        fetchUserLists: (_userId, request) => {
          requests.push(request)
          return Promise.resolve([])
        },
      })

      await content.loadFirstPages()

      expect(requests).toEqual([
        { page: 0, pageSize: PROFILE_PAGE_SIZE, onlyCurrent: true },
        { page: 0, pageSize: PROFILE_PAGE_SIZE, onlyPublic: true },
      ])
    })
  })

  describe('when an action fails', () => {
    it('keeps the error until the next load more starts', async () => {
      const fullPage = Array.from({ length: PROFILE_PAGE_SIZE }, (_, index) =>
        createProductWithImages({ id: `product-${index}` }),
      )
      const content = createContent({ fetchUserProducts: () => Promise.resolve(fullPage) })
      await content.loadFirstPages()

      content.reportActionError('denied')

      expect(content.actionError.value).toBe('denied')

      await content.products.loadMore()

      expect(content.actionError.value).toBeNull()
    })
  })
})
