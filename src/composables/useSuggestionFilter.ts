import { computed, ref, type ComputedRef, type Ref } from 'vue'

export const useSuggestionFilter = (
  suggestions: Ref<readonly string[]> | ComputedRef<readonly string[]>,
  query: Ref<string>,
): {
  isOpen: Ref<boolean>
  highlightedIndex: Ref<number>
  filteredSuggestions: ComputedRef<readonly string[]>
  open: () => void
  close: () => void
  highlightNext: () => void
  highlightPrevious: () => void
  pickHighlighted: () => string | null
} => {
  const isOpen = ref(false)
  const highlightedIndex = ref(-1)

  const filteredSuggestions = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase()
    if (!normalizedQuery) return suggestions.value
    return suggestions.value.filter((suggestion) =>
      suggestion.toLowerCase().includes(normalizedQuery),
    )
  })

  const open = (): void => {
    isOpen.value = true
    highlightedIndex.value = -1
  }

  const close = (): void => {
    isOpen.value = false
    highlightedIndex.value = -1
  }

  const highlightNext = (): void => {
    if (!isOpen.value || !filteredSuggestions.value.length) return
    highlightedIndex.value = (highlightedIndex.value + 1) % filteredSuggestions.value.length
  }

  const highlightPrevious = (): void => {
    if (!isOpen.value || !filteredSuggestions.value.length) return
    const suggestionsCount = filteredSuggestions.value.length
    highlightedIndex.value =
      highlightedIndex.value <= 0 ? suggestionsCount - 1 : highlightedIndex.value - 1
  }

  const pickHighlighted = (): string | null => {
    const highlighted = filteredSuggestions.value[highlightedIndex.value]
    return highlighted ?? null
  }

  return {
    isOpen,
    highlightedIndex,
    filteredSuggestions,
    open,
    close,
    highlightNext,
    highlightPrevious,
    pickHighlighted,
  }
}
