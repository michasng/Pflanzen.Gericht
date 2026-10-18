import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { useCatalogStore } from '@/stores/catalog'
import { catalogGatewayKey } from '@/services/CatalogGateway'
import { createFakeCatalogGateway } from '@/__tests__/createFakeCatalogGateway'
import CatalogActiveFilterChips from '@/components/catalog/CatalogActiveFilterChips.vue'

const mountChips = () => {
  const pinia = createPinia()
  const wrapper = mount(CatalogActiveFilterChips, {
    global: { plugins: [pinia], provide: { [catalogGatewayKey]: createFakeCatalogGateway() } },
  })
  const store = useCatalogStore(pinia)
  return { wrapper, store }
}

describe('CatalogActiveFilterChips', () => {
  describe('given no filter is active', () => {
    it('renders nothing', () => {
      const { wrapper } = mountChips()

      expect(wrapper.find('span').exists()).toBe(false)
    })
  })

  describe('given filters are active', () => {
    it('shows a chip for each filter', async () => {
      const { wrapper, store } = mountChips()

      store.setMinRating(4)
      store.setTags(['sweet'])
      store.setIncludeIngredients(['Hafer'])
      store.setExcludeIngredients(['Soja'])
      store.setExcludeAllergens(['gluten'])
      store.setOrganic(true)
      store.setBase('Hafer-Basis')
      store.setStore('Rewe')
      store.setCity('Berlin')
      await vi.waitFor(() => expect(wrapper.text()).toContain('Rewe · Berlin'))

      const text = wrapper.text()
      expect(text).toContain('≥ 4 ★')
      expect(text).toContain('Süß')
      expect(text).toContain('Hafer')
      expect(text).toContain('ohne Soja')
      expect(text).toContain('ohne Gluten')
      expect(text).toContain('Bio')
      expect(text).toContain('Hafer-Basis')
    })

    it.each([
      [{ min: 100, max: 300 }, '1,00 € – 3,00 €'],
      [{ min: 100, max: null }, 'ab 1,00 €'],
      [{ min: null, max: 300 }, 'bis 3,00 €'],
    ])('labels the price range %j as %s', async ({ min, max }, label) => {
      const { wrapper, store } = mountChips()

      store.setMinPriceCents(min)
      store.setMaxPriceCents(max)

      await vi.waitFor(() => expect(wrapper.text()).toContain(label))
    })
  })

  describe('when removing a single value', () => {
    it('keeps the other values of that filter', async () => {
      const { wrapper, store } = mountChips()
      store.setTags(['sweet', 'salty'])
      await vi.waitFor(() => expect(wrapper.text()).toContain('Süß'))

      await wrapper.get('button[aria-label="Süß entfernen"]').trigger('click')

      expect(store.tags).toEqual(['salty'])
    })
  })

  describe('when removing a chip of a single-value filter', () => {
    it('clears the store and its city together', async () => {
      const { wrapper, store } = mountChips()
      store.setStore('Rewe')
      store.setCity('Berlin')
      await vi.waitFor(() => expect(wrapper.text()).toContain('Rewe'))

      await wrapper.get('button[aria-label="Geschäft entfernen"]').trigger('click')

      expect(store.store).toBeNull()
      expect(store.city).toBeNull()
    })

    it('clears the organic filter', async () => {
      const { wrapper, store } = mountChips()
      store.setOrganic(true)
      await vi.waitFor(() => expect(wrapper.text()).toContain('Bio'))

      await wrapper.get('button[aria-label="Bio-Filter entfernen"]').trigger('click')

      expect(store.organic).toBe(false)
    })
  })
})
