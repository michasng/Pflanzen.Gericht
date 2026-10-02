import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/catalog', () => ({
  getImageUrl: () => '',
}))

import SimilarProductDialog from '@/components/SimilarProductDialog.vue'
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

describe('SimilarProductDialog', () => {
  describe('given the user previously agreed', () => {
    it('marks the thumbs-up button as pressed', () => {
      const wrapper = mount(SimilarProductDialog, {
        props: {
          errorMessage: null,
          isAdmin: false,
          isBusy: false,
          isLoggedIn: true,
          loginRedirectPath: '/product/1',
          product: similarProduct,
        },
        global: {
          stubs: {
            RouterLink: true,
            Teleport: true,
          },
        },
      })

      expect(wrapper.get('[aria-label="Daumen hoch"]').attributes('aria-pressed')).toBe('true')
      expect(wrapper.get('[aria-label="Daumen runter"]').attributes('aria-pressed')).toBe('false')
    })
  })

  describe('given the vote buttons are clicked', () => {
    it('emits the selected vote', async () => {
      const wrapper = mount(SimilarProductDialog, {
        props: {
          errorMessage: null,
          isAdmin: false,
          isBusy: false,
          isLoggedIn: true,
          loginRedirectPath: '/product/1',
          product: { ...similarProduct, myVote: null },
        },
        global: {
          stubs: {
            RouterLink: true,
            Teleport: true,
          },
        },
      })

      await wrapper.get('[aria-label="Daumen hoch"]').trigger('click')
      await wrapper.get('[aria-label="Daumen runter"]').trigger('click')

      expect(wrapper.emitted('vote')).toEqual([[true], [false]])
    })
  })

  describe('given dimension averages are available', () => {
    it('renders the aggregated dimension scores', () => {
      const wrapper = mount(SimilarProductDialog, {
        props: {
          errorMessage: null,
          isAdmin: false,
          isBusy: false,
          isLoggedIn: true,
          loginRedirectPath: '/product/1',
          product: similarProduct,
        },
        global: {
          stubs: {
            RouterLink: true,
            Teleport: true,
          },
        },
      })

      expect(wrapper.text()).toContain('Geschmack')
      expect(wrapper.text()).toContain('Konsistenz')
      expect(wrapper.text()).toContain('Aussehen')
      expect(wrapper.text()).toContain('Nährwerte')
      expect(wrapper.text()).toContain('Preis-Leistung')
    })
  })

  describe('given the product link is clicked', () => {
    it('does not close the dialog', async () => {
      const wrapper = mount(SimilarProductDialog, {
        props: {
          errorMessage: null,
          isAdmin: false,
          isBusy: false,
          isLoggedIn: true,
          loginRedirectPath: '/product/1',
          product: similarProduct,
        },
        global: {
          stubs: {
            RouterLink: true,
            Teleport: true,
          },
        },
      })

      await wrapper.find('router-link-stub').trigger('click')

      expect(wrapper.emitted('close')).toBeUndefined()
    })
  })

  describe('given the admin controls are visible', () => {
    it('emits remove when the similarity is deleted', async () => {
      const wrapper = mount(SimilarProductDialog, {
        props: {
          errorMessage: null,
          isAdmin: true,
          isBusy: false,
          isLoggedIn: true,
          loginRedirectPath: '/product/1',
          product: similarProduct,
        },
        global: {
          stubs: {
            RouterLink: true,
            Teleport: true,
          },
        },
      })

      await wrapper.get('[aria-label="Ähnlichkeit entfernen"]').trigger('click')

      expect(wrapper.emitted('remove')).toHaveLength(1)
    })
  })
})
