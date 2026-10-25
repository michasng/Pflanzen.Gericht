import { describe, expect, it } from 'vitest'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createProductWithImages } from '@/__tests__/createProductWithImages'
import {
  ALREADY_ON_LIST_LABEL,
  useListProducts,
  type ListProductsOptions,
} from '@/composables/useListProducts'
import type { ListProduct } from '@/lib/ListProduct'
import type { ListGateway } from '@/services/ListGateway'
import type { SimilarityCandidate } from '@/services/similarProducts'

const LIST_ID = 'list-1'
const PAGE_SIZE = 2

const createListProduct = (id: string): ListProduct => ({
  ...createProductWithImages({ id, name: id }),
  addedAt: '2026-10-01T00:00:00.000Z',
})

const createCandidate = (id: string): SimilarityCandidate => ({
  id,
  name: id,
  brand: null,
  category: 'drink',
  storagePath: null,
})

const createComposable = (
  gateway: Partial<ListGateway> = {},
  options: Partial<ListProductsOptions> = {},
) =>
  useListProducts({
    gateway: createFakeListGateway(gateway),
    listId: LIST_ID,
    pageSize: PAGE_SIZE,
    searchProducts: () => Promise.resolve([]),
    ...options,
  })

describe('useListProducts', () => {
  describe('when loading the first page', () => {
    it('keeps the order given by the gateway and requests the first page', async () => {
      const requests: unknown[] = []
      const { products, loadFirstPage } = createComposable({
        fetchListProducts: (listId, request) => {
          requests.push([listId, request])
          return Promise.resolve([createListProduct('newest'), createListProduct('older')])
        },
      })

      await loadFirstPage()

      expect(products.value.map((product) => product.id)).toEqual(['newest', 'older'])
      expect(requests).toEqual([[LIST_ID, { page: 0, pageSize: PAGE_SIZE }]])
    })

    it('reports a load error', async () => {
      const { loadError, loadFirstPage } = createComposable({
        fetchListProducts: () => Promise.reject(new Error('kaputt')),
      })

      await loadFirstPage()

      expect(loadError.value).toBe('kaputt')
    })
  })

  describe('given a full first page', () => {
    it('appends the next page when loading more', async () => {
      const pages = [[createListProduct('a'), createListProduct('b')], [createListProduct('c')]]
      const { products, hasMore, loadFirstPage, loadMore } = createComposable({
        fetchListProducts: (_listId, { page }) => Promise.resolve(pages[page] ?? []),
      })
      await loadFirstPage()
      expect(hasMore.value).toBe(true)

      await loadMore()

      expect(products.value.map((product) => product.id)).toEqual(['a', 'b', 'c'])
      expect(hasMore.value).toBe(false)
    })
  })

  describe('when adding a product', () => {
    it('adds it and shows it at the top', async () => {
      const added: unknown[] = []
      let stored = [createListProduct('old')]
      const { products, loadFirstPage, add } = createComposable({
        fetchListProducts: () => Promise.resolve(stored),
        addProductToList: (listId, productId) => {
          added.push([listId, productId])
          stored = [createListProduct(productId), ...stored]
          return Promise.resolve()
        },
      })
      await loadFirstPage()

      await add('new')

      expect(added).toEqual([[LIST_ID, 'new']])
      expect(products.value.map((product) => product.id)).toEqual(['new', 'old'])
    })

    it('rejects when the product cannot be added', async () => {
      const { add } = createComposable({
        addProductToList: () => Promise.reject(new Error('nicht erlaubt')),
      })

      await expect(add('new')).rejects.toThrow('nicht erlaubt')
    })
  })

  describe('when removing a product', () => {
    it('removes it from the list', async () => {
      const removed: unknown[] = []
      const { products, loadFirstPage, remove } = createComposable({
        fetchListProducts: () => Promise.resolve([createListProduct('a'), createListProduct('b')]),
        removeProductFromList: (listId, productId) => {
          removed.push([listId, productId])
          return Promise.resolve()
        },
      })
      await loadFirstPage()

      await remove('a')

      expect(removed).toEqual([[LIST_ID, 'a']])
      expect(products.value.map((product) => product.id)).toEqual(['b'])
    })

    it('keeps the product and reports the error when removing fails', async () => {
      const { products, actionError, loadFirstPage, remove } = createComposable({
        fetchListProducts: () => Promise.resolve([createListProduct('a')]),
        removeProductFromList: () => Promise.reject(new Error('nicht erlaubt')),
      })
      await loadFirstPage()

      await remove('a')

      expect(products.value.map((product) => product.id)).toEqual(['a'])
      expect(actionError.value).toBe('nicht erlaubt')
    })
  })

  describe('when searching for products to add', () => {
    it('marks products already on the list as unavailable', async () => {
      const lookups: unknown[] = []
      const { searchAddableProducts } = createComposable(
        {
          fetchProductIdsOnList: (listId, productIds) => {
            lookups.push([listId, productIds])
            return Promise.resolve(['on-list'])
          },
        },
        {
          searchProducts: () =>
            Promise.resolve([createCandidate('on-list'), createCandidate('free')]),
        },
      )

      const suggestions = await searchAddableProducts('hafer')

      expect(lookups).toEqual([[LIST_ID, ['on-list', 'free']]])
      expect(suggestions.map((suggestion) => suggestion.unavailableReason)).toEqual([
        ALREADY_ON_LIST_LABEL,
        undefined,
      ])
    })
  })
})
