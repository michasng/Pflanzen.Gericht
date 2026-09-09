import { afterEach, describe, expect, it, vi } from 'vitest'
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

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const createDeferred = <T>(): Deferred<T> => {
  let resolvePromise: ((value: T) => void) | undefined
  let rejectPromise: ((reason?: unknown) => void) | undefined
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  const resolve = (value: T): void => {
    if (!resolvePromise) throw new Error('Deferred promise is not initialized.')
    resolvePromise(value)
  }

  const reject = (reason?: unknown): void => {
    if (!rejectPromise) throw new Error('Deferred promise is not initialized.')
    rejectPromise(reason)
  }

  return { promise, resolve, reject }
}

const runDebouncedSearch = async (
  searchPromise: Promise<OriginalProductCandidate[]>,
): Promise<void> => {
  vi.advanceTimersByTime(400)
  await nextTick()
  await searchPromise.catch(() => undefined)
  await nextTick()
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
    vi.advanceTimersByTime(400)
    await nextTick()

    failedSearch.reject(new Error('boom'))
    await failedSearch.promise.catch(() => undefined)
    await nextTick()

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
    vi.advanceTimersByTime(400)
    await nextTick()

    await wrapper.get('input').setValue('Marke')
    vi.advanceTimersByTime(400)
    await nextTick()

    newerSearch.resolve([{ id: 'p2', name: 'Neues Original', brand: null, image: null }])
    await newerSearch.promise
    await nextTick()

    slowerSearch.resolve([{ id: 'p1', name: 'Altes Original', brand: null, image: null }])
    await slowerSearch.promise
    await nextTick()

    expect(wrapper.text()).toContain('Neues Original')
    expect(wrapper.text()).not.toContain('Altes Original')
  })
})
