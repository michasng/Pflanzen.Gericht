import { describe, expect, it, vi } from 'vitest'
import { usePaginatedList } from '../usePaginatedList'

interface FakeItem {
  id: string
}

const PAGE_SIZE = 2

const createItems = (...ids: string[]): FakeItem[] => ids.map((id) => ({ id }))

const createList = ({
  fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>(),
  deleteItem = vi.fn<(id: string) => Promise<void>>(),
  reportError = vi.fn<(message: string) => void>(),
} = {}) => usePaginatedList({ fetchPage, pageSize: PAGE_SIZE, deleteItem, reportError })

describe('usePaginatedList', () => {
  describe('when loading the first page', () => {
    it('stores the items of the first page', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValue(createItems('a', 'b'))
      const { items, loadFirstPage } = createList({ fetchPage })

      await loadFirstPage()

      expect(fetchPage).toHaveBeenCalledExactlyOnceWith(0)
      expect(items.value).toEqual(createItems('a', 'b'))
    })

    it('is loading until the page arrives', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValue([])
      const { loading, loadFirstPage } = createList({ fetchPage })

      const pending = loadFirstPage()

      expect(loading.value).toBe(true)
      await pending
      expect(loading.value).toBe(false)
    })
  })

  describe('given the first page is full', () => {
    it('has more items', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValue(createItems('a', 'b'))
      const { hasMore, loadFirstPage } = createList({ fetchPage })

      await loadFirstPage()

      expect(hasMore.value).toBe(true)
    })
  })

  describe('given the first page is not full', () => {
    it('has no more items', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValue(createItems('a'))
      const { hasMore, loadFirstPage } = createList({ fetchPage })

      await loadFirstPage()

      expect(hasMore.value).toBe(false)
    })
  })

  describe('given loading the first page fails', () => {
    it('exposes the error message', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockRejectedValue(new Error('offline'))
      const { loadError, loading, loadFirstPage } = createList({ fetchPage })

      await loadFirstPage()

      expect(loadError.value).toBe('offline')
      expect(loading.value).toBe(false)
    })
  })

  describe('when loading more', () => {
    it('appends the next page', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValueOnce(createItems('a', 'b')).mockResolvedValueOnce(createItems('c'))
      const { items, hasMore, loadFirstPage, loadMore } = createList({ fetchPage })
      await loadFirstPage()

      await loadMore()

      expect(fetchPage).toHaveBeenLastCalledWith(1)
      expect(items.value).toEqual(createItems('a', 'b', 'c'))
      expect(hasMore.value).toBe(false)
    })
  })

  describe('given loading more fails', () => {
    it('reports the error and retries the same page next time', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage
        .mockResolvedValueOnce(createItems('a', 'b'))
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(createItems('c'))
      const reportError = vi.fn<(message: string) => void>()
      const { loadingMore, loadFirstPage, loadMore } = createList({ fetchPage, reportError })
      await loadFirstPage()

      await loadMore()
      await loadMore()

      expect(reportError).toHaveBeenCalledExactlyOnceWith('offline')
      expect(fetchPage.mock.calls).toEqual([[0], [1], [1]])
      expect(loadingMore.value).toBe(false)
    })
  })

  describe('when removing an item', () => {
    it('deletes the item and drops it from the list', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValue(createItems('a', 'b'))
      const deleteItem = vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined)
      const { items, deletingId, loadFirstPage, remove } = createList({ fetchPage, deleteItem })
      await loadFirstPage()

      const pending = remove('a')

      expect(deletingId.value).toBe('a')
      await pending
      expect(deleteItem).toHaveBeenCalledExactlyOnceWith('a')
      expect(items.value).toEqual(createItems('b'))
      expect(deletingId.value).toBeNull()
    })
  })

  describe('given removing an item fails', () => {
    it('reports the error and keeps the item', async () => {
      const fetchPage = vi.fn<(page: number) => Promise<FakeItem[]>>()
      fetchPage.mockResolvedValue(createItems('a'))
      const deleteItem = vi.fn<(id: string) => Promise<void>>()
      deleteItem.mockRejectedValue(new Error('forbidden'))
      const reportError = vi.fn<(message: string) => void>()
      const { items, deletingId, loadFirstPage, remove } = createList({
        fetchPage,
        deleteItem,
        reportError,
      })
      await loadFirstPage()

      await remove('a')

      expect(reportError).toHaveBeenCalledExactlyOnceWith('forbidden')
      expect(items.value).toEqual(createItems('a'))
      expect(deletingId.value).toBeNull()
    })
  })
})
