import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSelection } from '../useSelection'

const createItems = (...ids: string[]) => ids.map((id) => ({ id }))

describe('useSelection', () => {
  describe('given nothing is selected', () => {
    it('is neither fully nor partially selected', () => {
      const { selectedIds, allSelected, someSelected } = useSelection(createItems('a', 'b'))

      expect(selectedIds.value).toEqual([])
      expect(allSelected.value).toBe(false)
      expect(someSelected.value).toBe(false)
    })
  })

  describe('given there are no items', () => {
    it('is not fully selected', () => {
      const { allSelected } = useSelection([])

      expect(allSelected.value).toBe(false)
    })
  })

  describe('when selecting one of several items', () => {
    it('is partially selected', () => {
      const { selectedIds, allSelected, someSelected, setSelected } = useSelection(
        createItems('a', 'b'),
      )

      setSelected('a', true)

      expect(selectedIds.value).toEqual(['a'])
      expect(allSelected.value).toBe(false)
      expect(someSelected.value).toBe(true)
    })
  })

  describe('when selecting every item individually', () => {
    it('is fully selected', () => {
      const { allSelected, someSelected, setSelected } = useSelection(createItems('a', 'b'))

      setSelected('a', true)
      setSelected('b', true)

      expect(allSelected.value).toBe(true)
      expect(someSelected.value).toBe(false)
    })
  })

  describe('when selecting the same item twice', () => {
    it('selects it once', () => {
      const { selectedIds, setSelected } = useSelection(createItems('a'))

      setSelected('a', true)
      setSelected('a', true)

      expect(selectedIds.value).toEqual(['a'])
    })
  })

  describe('when deselecting an item', () => {
    it('removes it from the selection', () => {
      const { selectedIds, setSelected } = useSelection(createItems('a', 'b'))
      setSelected('a', true)
      setSelected('b', true)

      setSelected('a', false)

      expect(selectedIds.value).toEqual(['b'])
    })
  })

  describe('when selecting all', () => {
    it('selects every item', () => {
      const { selectedIds, allSelected } = useSelection(createItems('a', 'b'))

      allSelected.value = true

      expect(selectedIds.value).toEqual(['a', 'b'])
    })
  })

  describe('given all items are selected', () => {
    describe('when deselecting all', () => {
      it('selects nothing', () => {
        const { selectedIds, allSelected } = useSelection(createItems('a', 'b'))
        allSelected.value = true

        allSelected.value = false

        expect(selectedIds.value).toEqual([])
      })
    })
  })

  describe('given a selected item disappears', () => {
    it('drops it from the selection', () => {
      const items = ref(createItems('a', 'b'))
      const { selectedIds, allSelected } = useSelection(items)
      allSelected.value = true

      items.value = createItems('b')

      expect(selectedIds.value).toEqual(['b'])
      expect(allSelected.value).toBe(true)
    })
  })
})
