import { describe, expect, it } from 'vitest'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createListSummary } from '@/__tests__/createListSummary'
import { useProductBookmark } from '@/composables/useProductBookmark'
import type { ListGateway } from '@/services/ListGateway'

const USER_ID = 'user-1'
const PRODUCT_ID = 'product-1'
const FAVORITES = createListSummary({ id: 'favorites', name: 'Favoriten' })
const TRY_LATER = createListSummary({ id: 'try-later', name: 'Probieren' })

const createComposable = (gateway: Partial<ListGateway> = {}) =>
  useProductBookmark({
    gateway: createFakeListGateway({
      fetchAllUserLists: () => Promise.resolve([FAVORITES, TRY_LATER]),
      ...gateway,
    }),
    ownerId: USER_ID,
    productId: PRODUCT_ID,
  })

describe('useProductBookmark', () => {
  describe('when loading', () => {
    it('lists the lists in gateway order and marks those containing the product', async () => {
      const requests: unknown[] = []
      const { lists, listIdsWithProduct, isBookmarked, load } = createComposable({
        fetchListIdsContainingProduct: (ownerId, productId) => {
          requests.push([ownerId, productId])
          return Promise.resolve([TRY_LATER.id])
        },
      })

      await load()

      expect(lists.value).toEqual([FAVORITES, TRY_LATER])
      expect(listIdsWithProduct.value).toEqual([TRY_LATER.id])
      expect(isBookmarked.value).toBe(true)
      expect(requests).toEqual([[USER_ID, PRODUCT_ID]])
    })

    it('is not bookmarked when no list contains the product', async () => {
      const { isBookmarked, load } = createComposable()

      await load()

      expect(isBookmarked.value).toBe(false)
    })

    it('reports a failure to load', async () => {
      const { loadError, loading, load } = createComposable({
        fetchAllUserLists: () => Promise.reject(new Error('offline')),
      })

      await load()

      expect(loadError.value).toBe('offline')
      expect(loading.value).toBe(false)
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

      await toggle(FAVORITES.id)

      expect(added).toEqual([[FAVORITES.id, PRODUCT_ID]])
      expect(listIdsWithProduct.value).toEqual([FAVORITES.id])
      expect(isBookmarked.value).toBe(true)
    })

    it('removes the product from a list containing it', async () => {
      const removed: unknown[] = []
      const { listIdsWithProduct, isBookmarked, load, toggle } = createComposable({
        fetchListIdsContainingProduct: () => Promise.resolve([FAVORITES.id]),
        removeProductFromList: (listId, productId) => {
          removed.push([listId, productId])
          return Promise.resolve()
        },
      })
      await load()

      await toggle(FAVORITES.id)

      expect(removed).toEqual([[FAVORITES.id, PRODUCT_ID]])
      expect(listIdsWithProduct.value).toEqual([])
      expect(isBookmarked.value).toBe(false)
    })

    it('keeps the state and reports the error when the gateway fails', async () => {
      const { listIdsWithProduct, actionError, toggle } = createComposable({
        addProductToList: () => Promise.reject(new Error('denied')),
      })

      await toggle(FAVORITES.id)

      expect(listIdsWithProduct.value).toEqual([])
      expect(actionError.value).toBe('denied')
    })
  })

  describe('when creating a list with the product', () => {
    it('creates the list, adds the product to it and reloads', async () => {
      const calls: unknown[] = []
      const created = createListSummary({ id: 'new-list', name: 'Neu' })
      let storedLists = [FAVORITES]
      const { lists, listIdsWithProduct, createListWithProduct } = createComposable({
        fetchAllUserLists: () => Promise.resolve(storedLists),
        fetchListIdsContainingProduct: () => Promise.resolve(['new-list']),
        createList: (ownerId, input) => {
          calls.push(['create', ownerId, input])
          storedLists = [FAVORITES, created]
          return Promise.resolve(created.id)
        },
        addProductToList: (listId, productId) => {
          calls.push(['add', listId, productId])
          return Promise.resolve()
        },
      })
      const input = { name: 'Neu', visibility: created.visibility }

      await createListWithProduct(input)

      expect(calls).toEqual([
        ['create', USER_ID, input],
        ['add', 'new-list', PRODUCT_ID],
      ])
      expect(lists.value).toEqual([FAVORITES, created])
      expect(listIdsWithProduct.value).toEqual(['new-list'])
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

      await expect(
        createListWithProduct({ name: 'Neu', visibility: FAVORITES.visibility }),
      ).rejects.toThrow('clash')
      expect(added).toEqual([])
    })
  })
})
