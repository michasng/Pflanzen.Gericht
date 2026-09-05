import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useCatalogUrlSync } from '@/composables/useCatalogUrlSync'

type StoreSpy = { fn: MockInstance; value: unknown }

const makeStoreMock = () => {
  const state: Record<string, unknown> = {
    search: '',
    category: null,
    base: null,
    sort: 'newest',
    store: null,
    city: null,
    minRating: null,
    tags: [],
    includeIngredients: [],
    excludeIngredients: [],
    minPriceCents: null,
    maxPriceCents: null,
  }
  const spies: Record<string, StoreSpy> = {}
  const makeSetter = (key: string) => {
    const spy = vi.fn<(v: unknown) => void>((v) => {
      state[key] = v
    })
    spies[key] = { fn: spy, value: undefined }
    return spy
  }
  return {
    ...state,
    setSearch: makeSetter('search'),
    setCategory: makeSetter('category'),
    setBase: makeSetter('base'),
    setSort: makeSetter('sort'),
    setStore: makeSetter('store'),
    setCity: makeSetter('city'),
    setMinRating: makeSetter('minRating'),
    setTags: makeSetter('tags'),
    setIncludeIngredients: makeSetter('includeIngredients'),
    setExcludeIngredients: makeSetter('excludeIngredients'),
    setMinPriceCents: makeSetter('minPriceCents'),
    setMaxPriceCents: makeSetter('maxPriceCents'),
    load: vi.fn<(reset?: boolean) => void>(),
    get state() {
      return state
    },
  }
}

type StoreMock = ReturnType<typeof makeStoreMock>

let storeMock: StoreMock
let routeQuery: Record<string, string | string[]>
const routerReplace = vi.fn<() => void>()

vi.mock('@/stores/catalog', () => ({
  useCatalogStore: () => storeMock,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ replace: routerReplace }),
}))

const mountComposable = () => {
  const Wrapper = defineComponent({
    setup() {
      useCatalogUrlSync()
    },
    template: '<div />',
  })
  return mount(Wrapper)
}

describe('useCatalogUrlSync', () => {
  beforeEach(() => {
    storeMock = makeStoreMock()
    routeQuery = {}
    routerReplace.mockClear()
  })

  it('hydrates search, category and sort from query params', () => {
    routeQuery = { q: 'tofu', category: 'meat', sort: 'top_rated' }
    mountComposable()
    expect(storeMock.setSearch).toHaveBeenCalledWith('tofu')
    expect(storeMock.setCategory).toHaveBeenCalledWith('meat')
    expect(storeMock.setSort).toHaveBeenCalledWith('top_rated')
  })

  it('falls back to newest for unknown sort', () => {
    routeQuery = { sort: 'garbage' }
    mountComposable()
    expect(storeMock.setSort).toHaveBeenCalledWith('newest')
  })

  it('hydrates the few ingredients sort from query params', () => {
    routeQuery = { sort: 'few_ingredients' }
    mountComposable()
    expect(storeMock.setSort).toHaveBeenCalledWith('few_ingredients')
  })

  it('maps minRating as number', () => {
    routeQuery = { minRating: '4' }
    mountComposable()
    expect(storeMock.setMinRating).toHaveBeenCalledWith(4)
  })

  it('maps tags as array when a single string', () => {
    routeQuery = { tags: 'organic' }
    mountComposable()
    expect(storeMock.setTags).toHaveBeenCalledWith(['organic'])
  })

  it('maps ingredient filters as arrays', () => {
    routeQuery = { includeIngredients: ['Hafer'], excludeIngredients: 'Milch' }
    mountComposable()
    expect(storeMock.setIncludeIngredients).toHaveBeenCalledWith(['Hafer'])
    expect(storeMock.setExcludeIngredients).toHaveBeenCalledWith(['Milch'])
  })

  it('maps minPrice and maxPrice as raw cents numbers', () => {
    routeQuery = { minPrice: '199', maxPrice: '499' }
    mountComposable()
    expect(storeMock.setMinPriceCents).toHaveBeenCalledWith(199)
    expect(storeMock.setMaxPriceCents).toHaveBeenCalledWith(499)
  })

  it('sets null for absent optional params', () => {
    routeQuery = {}
    mountComposable()
    expect(storeMock.setCategory).toHaveBeenCalledWith(null)
    expect(storeMock.setBase).toHaveBeenCalledWith(null)
    expect(storeMock.setMinRating).toHaveBeenCalledWith(null)
    expect(storeMock.setTags).toHaveBeenCalledWith([])
  })

  it('calls load after hydrating', () => {
    mountComposable()
    expect(storeMock.load).toHaveBeenCalledWith(true)
  })
})
