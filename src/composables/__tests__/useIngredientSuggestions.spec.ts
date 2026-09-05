import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useIngredientSuggestions } from '@/composables/useIngredientSuggestions'

const mountComposable = (fetchSuggestions: () => Promise<string[]>) => {
  let result!: ReturnType<typeof useIngredientSuggestions>
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useIngredientSuggestions(fetchSuggestions)
        return () => null
      },
    }),
  )
  return { wrapper, result: () => result }
}

describe('useIngredientSuggestions', () => {
  it('given suggestions load successfully, exposes them after mount', async () => {
    const suggestionsPromise = Promise.resolve(['Hafer', 'Palmöl'])
    const fetchSuggestions = vi.fn<() => Promise<string[]>>(() => suggestionsPromise)

    const { result } = mountComposable(fetchSuggestions)
    await suggestionsPromise

    expect(result().suggestions.value).toEqual(['Hafer', 'Palmöl'])
  })

  it('given fetching suggestions fails, falls back to an empty list', async () => {
    const suggestionsPromise = Promise.reject(new Error('network error'))
    const fetchSuggestions = vi.fn<() => Promise<string[]>>(() => suggestionsPromise)

    const { result } = mountComposable(fetchSuggestions)
    await suggestionsPromise.catch(() => undefined)

    expect(result().suggestions.value).toEqual([])
  })

  it('given refreshSuggestions is called again, replaces the previous suggestions', async () => {
    const initialSuggestionsPromise = Promise.resolve(['Hafer'])
    const fetchSuggestions = vi.fn<() => Promise<string[]>>(() => initialSuggestionsPromise)

    const { result } = mountComposable(fetchSuggestions)
    await initialSuggestionsPromise
    expect(result().suggestions.value).toEqual(['Hafer'])

    const updatedSuggestionsPromise = Promise.resolve(['Hafer', 'Palmöl'])
    fetchSuggestions.mockReturnValueOnce(updatedSuggestionsPromise)
    await result().refreshSuggestions()

    expect(result().suggestions.value).toEqual(['Hafer', 'Palmöl'])
  })
})
