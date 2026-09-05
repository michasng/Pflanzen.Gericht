import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
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
    vi.mocked(fetchIngredientNameSuggestions).mockResolvedValueOnce(['Hafer', 'Palmöl'])

    const { result } = mountComposable()
    await flushPromises()

    expect(result().suggestions.value).toEqual(['Hafer', 'Palmöl'])
  })

  it('given fetching suggestions fails, falls back to an empty list', async () => {
    const { fetchIngredientNameSuggestions } = await import('@/services/products')
    vi.mocked(fetchIngredientNameSuggestions).mockRejectedValueOnce(new Error('network error'))

    const { result } = mountComposable()
    await flushPromises()

    expect(result().suggestions.value).toEqual([])
  })

  it('given refreshSuggestions is called again, replaces the previous suggestions', async () => {
    const { fetchIngredientNameSuggestions } = await import('@/services/products')
    vi.mocked(fetchIngredientNameSuggestions).mockResolvedValueOnce(['Hafer'])

    const { result } = mountComposable()
    await flushPromises()
    expect(result().suggestions.value).toEqual(['Hafer'])

    vi.mocked(fetchIngredientNameSuggestions).mockResolvedValueOnce(['Hafer', 'Palmöl'])
    await result().refreshSuggestions()

    expect(result().suggestions.value).toEqual(['Hafer', 'Palmöl'])
  })
})
