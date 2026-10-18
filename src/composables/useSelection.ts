import { computed, shallowRef, toValue, type MaybeRefOrGetter } from 'vue'

export const useSelection = <T extends { id: string }>(
  visibleItems: MaybeRefOrGetter<readonly T[]>,
) => {
  const selectedItems = shallowRef<readonly T[]>([])

  const selectedIds = computed(() => selectedItems.value.map((item) => item.id))

  const visibleSelectedCount = computed(
    () => toValue(visibleItems).filter((item) => selectedIds.value.includes(item.id)).length,
  )

  const allSelected = computed({
    get: () => {
      const visibleCount = toValue(visibleItems).length
      return visibleCount > 0 && visibleSelectedCount.value === visibleCount
    },
    set: (selectAll: boolean) => {
      const visible = toValue(visibleItems)
      const visibleIds = visible.map((item) => item.id)
      const hiddenSelectedItems = selectedItems.value.filter(
        (item) => !visibleIds.includes(item.id),
      )
      selectedItems.value = selectAll ? [...hiddenSelectedItems, ...visible] : hiddenSelectedItems
    },
  })

  const someSelected = computed(() => visibleSelectedCount.value > 0 && !allSelected.value)

  const setSelected = (item: T, selected: boolean): void => {
    const otherItems = selectedItems.value.filter((selectedItem) => selectedItem.id !== item.id)
    selectedItems.value = selected ? [...otherItems, item] : otherItems
  }

  const deselectIds = (ids: readonly string[]): void => {
    selectedItems.value = selectedItems.value.filter((item) => !ids.includes(item.id))
  }

  return { selectedItems, selectedIds, allSelected, someSelected, setSelected, deselectIds }
}
