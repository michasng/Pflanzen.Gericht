import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSuggestionFilter } from '@/composables/useSuggestionFilter'

describe('useSuggestionFilter', () => {
  it('given no query, exposes all suggestions', () => {
    const suggestions = ref(['Hafer', 'Palmöl'])
    const query = ref('')

    const { filteredSuggestions } = useSuggestionFilter(suggestions, query)

    expect(filteredSuggestions.value).toEqual(['Hafer', 'Palmöl'])
  })

  it('given a query, filters suggestions case-insensitively by substring', () => {
    const suggestions = ref(['Hafer', 'Palmöl', 'Haferflocken'])
    const query = ref('haf')

    const { filteredSuggestions } = useSuggestionFilter(suggestions, query)

    expect(filteredSuggestions.value).toEqual(['Hafer', 'Haferflocken'])
  })

  it('given open is called, sets isOpen to true and resets the highlight', () => {
    const suggestions = ref(['Hafer'])
    const query = ref('')

    const { isOpen, highlightedIndex, open } = useSuggestionFilter(suggestions, query)
    open()

    expect(isOpen.value).toBe(true)
    expect(highlightedIndex.value).toBe(-1)
  })

  it('given close is called, sets isOpen to false and resets the highlight', () => {
    const suggestions = ref(['Hafer'])
    const query = ref('')

    const { isOpen, highlightedIndex, open, close, highlightNext } = useSuggestionFilter(
      suggestions,
      query,
    )
    open()
    highlightNext()
    close()

    expect(isOpen.value).toBe(false)
    expect(highlightedIndex.value).toBe(-1)
  })

  it('given the list is closed, highlightNext does not change the highlight', () => {
    const suggestions = ref(['Hafer', 'Palmöl'])
    const query = ref('')

    const { highlightedIndex, highlightNext } = useSuggestionFilter(suggestions, query)
    highlightNext()

    expect(highlightedIndex.value).toBe(-1)
  })

  it('given the list is open, highlightNext cycles forward through suggestions', () => {
    const suggestions = ref(['Hafer', 'Palmöl'])
    const query = ref('')

    const { highlightedIndex, open, highlightNext } = useSuggestionFilter(suggestions, query)
    open()
    highlightNext()
    expect(highlightedIndex.value).toBe(0)
    highlightNext()
    expect(highlightedIndex.value).toBe(1)
    highlightNext()
    expect(highlightedIndex.value).toBe(0)
  })

  it('given the list is open, highlightPrevious cycles backward through suggestions', () => {
    const suggestions = ref(['Hafer', 'Palmöl'])
    const query = ref('')

    const { highlightedIndex, open, highlightPrevious } = useSuggestionFilter(suggestions, query)
    open()
    highlightPrevious()
    expect(highlightedIndex.value).toBe(1)
    highlightPrevious()
    expect(highlightedIndex.value).toBe(0)
  })

  it('given nothing is highlighted, pickHighlighted returns null', () => {
    const suggestions = ref(['Hafer'])
    const query = ref('')

    const { pickHighlighted } = useSuggestionFilter(suggestions, query)

    expect(pickHighlighted()).toBeNull()
  })

  it('given a suggestion is highlighted, pickHighlighted returns it', () => {
    const suggestions = ref(['Hafer', 'Palmöl'])
    const query = ref('')

    const { open, highlightNext, pickHighlighted } = useSuggestionFilter(suggestions, query)
    open()
    highlightNext()

    expect(pickHighlighted()).toBe('Hafer')
  })
})
