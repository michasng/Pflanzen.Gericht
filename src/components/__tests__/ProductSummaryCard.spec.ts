import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductSummaryCard from '@/components/ProductSummaryCard.vue'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { createProductWithImages } from '@/__tests__/createProductWithImages'
import { formatDate } from '@/lib/date'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import type { ProductWithImages } from '@/lib/ProductWithImages'

const mountCard = (
  props: { reviewsCount?: number; product?: ProductWithImages; addedAt?: string } = {},
  slots: Record<string, string> = {},
) =>
  mount(ProductSummaryCard, {
    props: { product: createProductWithImages({ name: 'Mandelmilch' }), ...props },
    slots,
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      provide: { [imageUrlGatewayKey]: createFakeImageUrlGateway() },
    },
  })

describe('ProductSummaryCard', () => {
  describe('given only a product', () => {
    it('shows its name and offers no actions area', () => {
      const wrapper = mountCard()

      expect(wrapper.text()).toContain('Mandelmilch')
      expect(wrapper.find('.border-t').exists()).toBe(false)
    })
  })

  describe('given product images', () => {
    it('shows the first image by sort order with the product name as alt text', () => {
      const wrapper = mountCard({
        product: createProductWithImages({
          name: 'Mandelmilch',
          images: [
            { storagePath: 'second', sortOrder: 1 },
            { storagePath: 'first', sortOrder: 0 },
          ],
        }),
      })

      const image = wrapper.get('img')
      expect(image.attributes('src')).toContain('/first/')
      expect(image.attributes('alt')).toBe('Mandelmilch')
    })
  })

  describe('given no product images', () => {
    it('shows no image', () => {
      expect(mountCard().find('img').exists()).toBe(false)
    })
  })

  describe('given a reviews count', () => {
    it('shows it in front of the date', () => {
      const wrapper = mountCard({ reviewsCount: 3 })

      expect(wrapper.text()).toMatch(/3 Bewertungen · /)
    })
  })

  describe('given an added date', () => {
    it('shows it in place of the creation date', () => {
      const wrapper = mountCard({ addedAt: '2026-10-05T12:00:00.000Z' })

      expect(wrapper.text()).toContain(`hinzugefügt am ${formatDate('2026-10-05T12:00:00.000Z')}`)
      expect(wrapper.text()).not.toContain(formatDate('2026-09-11T00:00:00.000Z'))
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
