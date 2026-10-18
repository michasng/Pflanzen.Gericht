import { shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useDeletableList } from '../useDeletableList'

interface FakeItem {
  id: string
}

const createItems = (...ids: string[]): FakeItem[] => ids.map((id) => ({ id }))

const createList = ({
  items = shallowRef(createItems('a', 'b')),
  deleteItem = vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
  reportError = vi.fn<(message: string) => void>(),
} = {}) => ({ items, ...useDeletableList({ items, deleteItem, reportError }) })

describe('useDeletableList', () => {
  describe('when removing an item', () => {
    it('deletes the item and drops it from the list', async () => {
      const deleteItem = vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined)
      const { items, deletingId, remove } = createList({ deleteItem })

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
      const deleteItem = vi.fn<(id: string) => Promise<void>>()
      deleteItem.mockRejectedValue(new Error('forbidden'))
      const reportError = vi.fn<(message: string) => void>()
      const { items, deletingId, remove } = createList({ deleteItem, reportError })

      await remove('a')

      expect(reportError).toHaveBeenCalledExactlyOnceWith('forbidden')
      expect(items.value).toEqual(createItems('a', 'b'))
      expect(deletingId.value).toBeNull()
    })
  })
})
