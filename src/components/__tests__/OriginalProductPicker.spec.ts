import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { OriginalProductCandidate } from '@/services/products'

const searchOriginalProductCandidates =
  vi.fn<
    (
      name: string,
      category: string,
      excludeProductId: string,
    ) => Promise<OriginalProductCandidate[]>
  >()

vi.mock('@/services/products', () => ({
  searchOriginalProductCandidates: (name: string, category: string, excludeProductId: string) =>
    searchOriginalProductCandidates(name, category, excludeProductId),
}))

vi.mock('@/services/catalog', () => ({
  getImageUrl: () => '',
}))

import OriginalProductPicker from '../OriginalProductPicker.vue'

const flushSearch = async (): Promise<void> => {
  vi.advanceTimersByTime(400)
  await searchOriginalProductCandidates.mock.results[0]!.value
  await nextTick()
}

describe('OriginalProductPicker', () => {
  it('given a search query is typed, shows matching candidates after debounce', async () => {
    searchOriginalProductCandidates.mockResolvedValue([
      { id: 'p1', name: 'Markenprodukt', brand: 'Marke', image: null },
    ])
    vi.useFakeTimers()
    const wrapper = mount(OriginalProductPicker, {
      props: { productId: 'p2', category: 'schnitzel', modelValue: null },
    })

    await wrapper.get('input').setValue('Marke')
    await flushSearch()

    expect(searchOriginalProductCandidates).toHaveBeenCalledWith('Marke', 'schnitzel', 'p2')
    expect(wrapper.text()).toContain('Markenprodukt')
    vi.useRealTimers()
  })

  it('given a candidate is picked, emits it as the selected product', async () => {
    searchOriginalProductCandidates.mockResolvedValue([
      { id: 'p1', name: 'Markenprodukt', brand: null, image: null },
    ])
    vi.useFakeTimers()
    const wrapper = mount(OriginalProductPicker, {
      props: { productId: 'p2', category: 'schnitzel', modelValue: null },
    })

    await wrapper.get('input').setValue('Marke')
    await flushSearch()
    await wrapper.get('li button').trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ id: 'p1', name: 'Markenprodukt', brand: null, image: null }],
    ])
    vi.useRealTimers()
  })

  it('given a product is already selected, shows it with a way to remove it', async () => {
    const wrapper = mount(OriginalProductPicker, {
      props: {
        productId: 'p2',
        category: 'schnitzel',
        modelValue: { id: 'p1', name: 'Markenprodukt', brand: null, image: null },
      },
    })

    expect(wrapper.text()).toContain('Markenprodukt')
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
