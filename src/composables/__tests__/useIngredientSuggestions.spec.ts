import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useIngredientSuggestions } from '@/composables/useIngredientSuggestions'

vi.mock('@/services/products', () => ({
  fetchIngredientNameSuggestions: vi.fn<() => Promise<string[]>>(),
}))

const mountComposable = () => {
  let result!: ReturnType<typeof useIngredientSuggestions>
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useIngredientSuggestions()
        return () => null
      },
    }),
  )
  return { wrapper, result: () => result }
}

describe('useIngredientSuggestions', () => {
  it('given suggestions load successfully, exposes them after mount', async () => {
    const { fetchIngredientNameSuggestions } = await import('@/services/products')
    const suggestionsPromise = Promise.resolve(['Hafer', 'Palmöl'])
    vi.mocked(fetchIngredientNameSuggestions).mockReturnValueOnce(suggestionsPromise)

    const { result } = mountComposable()
    await suggestionsPromise

    expect(result().suggestions.value).toEqual(['Hafer', 'Palmöl'])
  })

  it('given fetching suggestions fails, falls back to an empty list', async () => {
    const { fetchIngredientNameSuggestions } = await import('@/services/products')
    const suggestionsPromise = Promise.reject(new Error('network error'))
    vi.mocked(fetchIngredientNameSuggestions).mockReturnValueOnce(suggestionsPromise)

    const { result } = mountComposable()
    await suggestionsPromise.catch(() => undefined)

    expect(result().suggestions.value).toEqual([])
  })

  it('given refreshSuggestions is called again, replaces the previous suggestions', async () => {
    const { fetchIngredientNameSuggestions } = await import('@/services/products')
    const initialSuggestionsPromise = Promise.resolve(['Hafer'])
    vi.mocked(fetchIngredientNameSuggestions).mockReturnValueOnce(initialSuggestionsPromise)

    const { result } = mountComposable()
    await initialSuggestionsPromise
    expect(result().suggestions.value).toEqual(['Hafer'])

    const updatedSuggestionsPromise = Promise.resolve(['Hafer', 'Palmöl'])
    vi.mocked(fetchIngredientNameSuggestions).mockReturnValueOnce(updatedSuggestionsPromise)
    await result().refreshSuggestions()

    expect(result().suggestions.value).toEqual(['Hafer', 'Palmöl'])
  })
})
