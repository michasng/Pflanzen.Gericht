import { describe, expect, it } from 'vitest'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { useProductBookmarks } from '@/composables/useProductBookmarks'
import type { ListGateway } from '@/services/ListGateway'

const USER_ID = 'user-1'
const PRODUCT_ID = 'product-1'
const OTHER_PRODUCT_ID = 'product-2'
const FAVORITES = createListSummary({ id: 'favorites', name: 'Favoriten' })
const TRY_LATER = createListSummary({ id: 'try-later', name: 'Probieren' })

const createComposable = (
  gateway: Partial<ListGateway> = {},
  ownerId: () => string | null = () => USER_ID,
) =>
  useProductBookmarks({
    gateway: createFakeListGateway({
      fetchAllUserLists: () => Promise.resolve([FAVORITES, TRY_LATER]),
      ...gateway,
    }),
    ownerId,
  })

describe('useProductBookmarks', () => {
  describe('when loading', () => {
    it('lists the lists in gateway order and marks the lists containing each product', async () => {
      const requests: unknown[] = []
      const { lists, listIdsWithProduct, isBookmarked, load } = createComposable({
        fetchListIdsByProductId: (ownerId, productIds) => {
          requests.push([ownerId, productIds])
          return Promise.resolve({ [PRODUCT_ID]: [TRY_LATER.id], [OTHER_PRODUCT_ID]: [] })
        },
      })

      await load([PRODUCT_ID, OTHER_PRODUCT_ID])

      expect(lists.value).toEqual([FAVORITES, TRY_LATER])
      expect(listIdsWithProduct(PRODUCT_ID)).toEqual([TRY_LATER.id])
      expect(isBookmarked(PRODUCT_ID)).toBe(true)
      expect(isBookmarked(OTHER_PRODUCT_ID)).toBe(false)
      expect(requests).toEqual([[USER_ID, [PRODUCT_ID, OTHER_PRODUCT_ID]]])
    })

    it('only requests the memberships of products not loaded before', async () => {
      const requests: string[][] = []
      let listRequests = 0
      const { load } = createComposable({
        fetchAllUserLists: () => {
          listRequests += 1
          return Promise.resolve([FAVORITES])
        },
        fetchListIdsByProductId: (_ownerId, productIds) => {
          requests.push(productIds)
          return Promise.resolve({})
        },
      })

      await load([PRODUCT_ID])
      await load([PRODUCT_ID, OTHER_PRODUCT_ID])

      expect(requests).toEqual([[PRODUCT_ID], [OTHER_PRODUCT_ID]])
      expect(listRequests).toBe(1)
    })

    it('requests nothing without products or without a user', async () => {
      const requests: unknown[] = []
      const gateway = {
        fetchAllUserLists: () => {
          requests.push('lists')
          return Promise.resolve([])
        },
        fetchListIdsByProductId: () => {
          requests.push('memberships')
          return Promise.resolve({})
        },
      }
      const withoutUser = createComposable(gateway, () => null)
      const withoutProducts = createComposable(gateway)

      await withoutUser.load([PRODUCT_ID])
      await withoutProducts.load([])

      expect(requests).toEqual([])
    })

    it('reports a failure to load and retries on the next load', async () => {
      let failing = true
      const { loadError, loading, listIdsWithProduct, load } = createComposable({
        fetchListIdsByProductId: () =>
          failing
            ? Promise.reject(new Error('offline'))
            : Promise.resolve({ [PRODUCT_ID]: [FAVORITES.id] }),
      })

      await load([PRODUCT_ID])

      expect(loadError.value).toBe('offline')
      expect(loading.value).toBe(false)

      failing = false
      await load([PRODUCT_ID])

      expect(loadError.value).toBeNull()
      expect(listIdsWithProduct(PRODUCT_ID)).toEqual([FAVORITES.id])
    })
  })

  describe('when toggling a list', () => {
    it('adds the product to a list without it', async () => {
      const added: unknown[] = []
      const { listIdsWithProduct, isBookmarked, toggle } = createComposable({
        addProductToList: (listId, productId) => {
          added.push([listId, productId])
          return Promise.resolve()
        },
      })

      await toggle(PRODUCT_ID, FAVORITES.id)

      expect(added).toEqual([[FAVORITES.id, PRODUCT_ID]])
      expect(listIdsWithProduct(PRODUCT_ID)).toEqual([FAVORITES.id])
      expect(isBookmarked(PRODUCT_ID)).toBe(true)
      expect(isBookmarked(OTHER_PRODUCT_ID)).toBe(false)
    })

    it('removes the product from a list containing it', async () => {
      const removed: unknown[] = []
      const { listIdsWithProduct, isBookmarked, load, toggle } = createComposable({
        fetchListIdsByProductId: () => Promise.resolve({ [PRODUCT_ID]: [FAVORITES.id] }),
        removeProductFromList: (listId, productId) => {
          removed.push([listId, productId])
          return Promise.resolve()
        },
      })
      await load([PRODUCT_ID])

      await toggle(PRODUCT_ID, FAVORITES.id)

      expect(removed).toEqual([[FAVORITES.id, PRODUCT_ID]])
      expect(listIdsWithProduct(PRODUCT_ID)).toEqual([])
      expect(isBookmarked(PRODUCT_ID)).toBe(false)
    })

    it('keeps the state and reports the error when the gateway fails', async () => {
      const { listIdsWithProduct, actionError, toggle } = createComposable({
        addProductToList: () => Promise.reject(new Error('denied')),
      })

      await toggle(PRODUCT_ID, FAVORITES.id)

      expect(listIdsWithProduct(PRODUCT_ID)).toEqual([])
      expect(actionError.value).toBe('denied')
    })
  })

  describe('when creating a list with the product', () => {
    const input = { name: 'Neu', visibility: FAVORITES.visibility }
    const created = createListSummary({ id: 'new-list', name: 'Neu' })

    it('creates the list, adds the product to it and shows the new list', async () => {
      const calls: unknown[] = []
      const { lists, listIdsWithProduct, createListWithProduct } = createComposable({
        fetchAllUserLists: () => Promise.resolve([FAVORITES, created]),
        createList: (ownerId, listInput) => {
          calls.push(['create', ownerId, listInput])
          return Promise.resolve(created.id)
        },
        addProductToList: (listId, productId) => {
          calls.push(['add', listId, productId])
          return Promise.resolve()
        },
      })

      await createListWithProduct(PRODUCT_ID, input)

      expect(calls).toEqual([
        ['create', USER_ID, input],
        ['add', 'new-list', PRODUCT_ID],
      ])
      expect(lists.value).toEqual([FAVORITES, created])
      expect(listIdsWithProduct(PRODUCT_ID)).toEqual(['new-list'])
    })

    it('rejects with the gateway error and does not add the product', async () => {
      const added: unknown[] = []
      const { createListWithProduct } = createComposable({
        createList: () => Promise.reject(new Error('clash')),
        addProductToList: (listId) => {
          added.push(listId)
          return Promise.resolve()
        },
      })

      await expect(createListWithProduct(PRODUCT_ID, input)).rejects.toThrow('clash')
      expect(added).toEqual([])
    })

    it('keeps the created list and reports the error when adding the product fails', async () => {
      const { lists, listIdsWithProduct, actionError, createListWithProduct } = createComposable({
        fetchAllUserLists: () => Promise.resolve([FAVORITES, created]),
        createList: () => Promise.resolve(created.id),
        addProductToList: () => Promise.reject(new Error('denied')),
      })

      await createListWithProduct(PRODUCT_ID, input)

      expect(lists.value).toEqual([FAVORITES, created])
      expect(listIdsWithProduct(PRODUCT_ID)).toEqual([])
      expect(actionError.value).toBe('denied')
    })
  })
})
