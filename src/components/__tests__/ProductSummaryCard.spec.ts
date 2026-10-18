import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import { createProduct } from '@/__tests__/createProduct'

const mountCard = (props: { reviewsCount?: number } = {}, slots: Record<string, string> = {}) =>
  mount(ProductSummaryCard, {
    props: { product: createProduct({ name: 'Mandelmilch' }), ...props },
    slots,
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })

describe('ProductSummaryCard', () => {
  describe('given only a product', () => {
    it('shows its name and offers no actions area', () => {
      const wrapper = mountCard()

      expect(wrapper.text()).toContain('Mandelmilch')
      expect(wrapper.find('.border-t').exists()).toBe(false)
    })
  })

  describe('given a reviews count', () => {
    it('shows it in front of the date', () => {
      const wrapper = mountCard({ reviewsCount: 3 })

      expect(wrapper.text()).toMatch(/3 Bewertungen · /)
    })
  })

  describe('given slot content', () => {
    it('renders the leading control and the actions', () => {
      const wrapper = mountCard(
        {},
        { leading: '<input type="checkbox" />', actions: '<button>Löschen</button>' },
      )

      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
      expect(wrapper.get('.border-t').text()).toBe('Löschen')
    })
  })
})
