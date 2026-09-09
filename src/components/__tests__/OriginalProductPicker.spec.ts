import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createDeferred } from '@/__tests__/createDeferred'
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

const runDebouncedSearch = async (
  searchPromise: Promise<OriginalProductCandidate[]>,
): Promise<void> => {
  await vi.advanceTimersByTimeAsync(400)
  await searchPromise.catch(() => undefined)
}

describe('OriginalProductPicker', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('given a search query is typed, shows matching candidates after debounce', async () => {
    const searchPromise = Promise.resolve([
      { id: 'p1', name: 'Markenprodukt', brand: 'Marke', image: null },
    ])
    searchOriginalProductCandidates.mockReturnValueOnce(searchPromise)
    vi.useFakeTimers()
    const wrapper = mount(OriginalProductPicker, {
      props: { productId: 'p2', category: 'schnitzel', modelValue: null },
    })

    await wrapper.get('input').setValue('Marke')
    await runDebouncedSearch(searchPromise)

    expect(searchOriginalProductCandidates).toHaveBeenCalledWith('Marke', 'schnitzel', 'p2')
    expect(wrapper.text()).toContain('Markenprodukt')
  })

  it('given a candidate is picked, emits it as the selected product', async () => {
    const searchPromise = Promise.resolve([
      { id: 'p1', name: 'Markenprodukt', brand: null, image: null },
    ])
    searchOriginalProductCandidates.mockReturnValueOnce(searchPromise)
    vi.useFakeTimers()
    const wrapper = mount(OriginalProductPicker, {
      props: { productId: 'p2', category: 'schnitzel', modelValue: null },
    })

    await wrapper.get('input').setValue('Marke')
    await runDebouncedSearch(searchPromise)
    await wrapper.get('li button').trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [{ id: 'p1', name: 'Markenprodukt', brand: null, image: null }],
    ])
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

  it('given a search fails, shows an inline error instead of rejecting', async () => {
    const failedSearch = createDeferred<OriginalProductCandidate[]>()
    searchOriginalProductCandidates.mockReturnValueOnce(failedSearch.promise)
    vi.useFakeTimers()
    const wrapper = mount(OriginalProductPicker, {
      props: { productId: 'p2', category: 'schnitzel', modelValue: null },
    })

    await wrapper.get('input').setValue('Marke')
    await vi.advanceTimersByTimeAsync(400)

    failedSearch.reject(new Error('boom'))
    await failedSearch.promise.catch(() => undefined)
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.text()).toContain('Originale konnten nicht geladen werden.')
    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('given an older search resolves after a newer one, keeps the newer results', async () => {
    const slowerSearch = createDeferred<OriginalProductCandidate[]>()
    const newerSearch = createDeferred<OriginalProductCandidate[]>()
    searchOriginalProductCandidates
      .mockReturnValueOnce(slowerSearch.promise)
      .mockReturnValueOnce(newerSearch.promise)
    vi.useFakeTimers()
    const wrapper = mount(OriginalProductPicker, {
      props: { productId: 'p2', category: 'schnitzel', modelValue: null },
    })

    await wrapper.get('input').setValue('Mar')
    await vi.advanceTimersByTimeAsync(400)

    await wrapper.get('input').setValue('Marke')
    await vi.advanceTimersByTimeAsync(400)

    newerSearch.resolve([{ id: 'p2', name: 'Neues Original', brand: null, image: null }])
    await newerSearch.promise
    await vi.advanceTimersByTimeAsync(0)

    slowerSearch.resolve([{ id: 'p1', name: 'Altes Original', brand: null, image: null }])
    await slowerSearch.promise
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.text()).toContain('Neues Original')
    expect(wrapper.text()).not.toContain('Altes Original')
  })
})
