import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/catalog', () => ({
  getImageUrl: () => '',
}))

import SimilarProductCard from '@/components/SimilarProductCard.vue'
import type { SimilarProduct } from '@/services/similarProducts'

const similarProduct: SimilarProduct = {
  agreeCount: 4,
  agreementRate: 0.8,
  allergens: ['soy'],
  avgAppearance: 3.8,
  avgConsistency: 4.0,
  avgNutrition: 3.6,
  avgOverall: 4.2,
  avgTaste: 4.4,
  avgValue: 4.1,
  base: 'soy',
  brand: 'Marke',
  category: 'drink',
  id: 'product-2',
  isOrganic: true,
  myVote: true,
  name: 'Soja Drink',
  reviewsCount: 12,
  storagePath: null,
  totalCount: 5,
}

describe('SimilarProductCard', () => {
  describe('given a similar product with an agreement rate', () => {
    it('shows the agreement as a progress bar without explicit labels', () => {
      const wrapper = mount(SimilarProductCard, {
        props: { product: similarProduct },
      })

      const progressBar = wrapper.find('[role="progressbar"]')

      expect(progressBar.attributes('aria-label')).toBe('Zustimmung')
      expect(progressBar.attributes('aria-valuenow')).toBe('80')
      expect(progressBar.attributes('aria-valuetext')).toBe('80 % Zustimmung')
    })
  })

  describe('given the card is clicked', () => {
    it('emits select', async () => {
      const wrapper = mount(SimilarProductCard, {
        props: { product: similarProduct },
      })

      await wrapper.trigger('click')

      expect(wrapper.emitted('select')).toHaveLength(1)
    })
  })
})
