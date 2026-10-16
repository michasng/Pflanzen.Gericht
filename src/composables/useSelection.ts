import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

export const useSelection = (items: MaybeRefOrGetter<readonly { id: string }[]>) => {
  const chosenIds = ref<string[]>([])

  const selectedIds = computed(() => {
    const existingIds = new Set(toValue(items).map((item) => item.id))
    return chosenIds.value.filter((id) => existingIds.has(id))
  })

  const allSelected = computed({
    get: () => {
      const itemCount = toValue(items).length
      return itemCount > 0 && selectedIds.value.length === itemCount
    },
    set: (selectAll: boolean) => {
      chosenIds.value = selectAll ? toValue(items).map((item) => item.id) : []
    },
  })

  const someSelected = computed(() => selectedIds.value.length > 0 && !allSelected.value)

  const setSelected = (id: string, selected: boolean): void => {
    const otherIds = chosenIds.value.filter((chosenId) => chosenId !== id)
    chosenIds.value = selected ? [...otherIds, id] : otherIds
  }

  return { selectedIds, allSelected, someSelected, setSelected }
}
