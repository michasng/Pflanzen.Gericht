import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/catalog', () => ({
  getImageUrl: () => '',
}))

import SimilarProductCard from '@/components/SimilarProductCard.vue'
import type { SimilarProduct } from '@/services/similarProducts'

const similarProduct: SimilarProduct = {
  agree_count: 4,
  agreement_rate: 0.8,
  allergens: ['soy'],
  avg_appearance: 3.8,
  avg_consistency: 4.0,
  avg_nutrition: 3.6,
  avg_overall: 4.2,
  avg_taste: 4.4,
  avg_value: 4.1,
  base: 'soy',
  brand: 'Marke',
  category: 'drink',
  id: 'product-2',
  is_organic: true,
  my_vote: true,
  name: 'Soja Drink',
  ratings_count: 12,
  storage_path: null,
  total_count: 5,
}

describe('SimilarProductCard', () => {
  describe('given a similar product with an agreement rate', () => {
    it('shows the agreement as a progress bar without explicit labels', () => {
      const wrapper = mount(SimilarProductCard, {
        props: { product: similarProduct },
      })

      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('80')
      expect(wrapper.text()).not.toContain('Zustimmung')
      expect(wrapper.text()).not.toContain('Stimme')
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
