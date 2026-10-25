import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { createReviewWithMeta } from '@/__tests__/createReviewWithMeta'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import type { ReviewWithMeta } from '@/services/profile'

const mountCard = (
  props: { author?: { id: string; username: string }; review?: ReviewWithMeta } = {},
  slots: Record<string, string> = {},
) =>
  mount(ReviewSummaryCard, {
    props: { review: createReviewWithMeta({ comment: 'Lecker' }), ...props },
    slots,
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' }, StarDisplay: true },
      provide: { [imageUrlGatewayKey]: createFakeImageUrlGateway() },
    },
  })

describe('ReviewSummaryCard', () => {
  describe('given only a review', () => {
    it('shows product and comment but no author, status or actions', () => {
      const wrapper = mountCard()

      expect(wrapper.text()).toContain('Hafermilch')
      expect(wrapper.text()).toContain('Lecker')
      expect(wrapper.text()).not.toContain('von')
      expect(wrapper.find('.border-t').exists()).toBe(false)
    })
  })

  describe('given a review image', () => {
    it('shows it from the review images', () => {
      const wrapper = mountCard({
        review: createReviewWithMeta({ images: [{ storagePath: 'review-a', sortOrder: 0 }] }),
      })

      expect(wrapper.get('img').attributes('src')).toContain('review-images/review-a')
    })
  })

  describe('given only a product image', () => {
    it('falls back to the product image', () => {
      const wrapper = mountCard({
        review: createReviewWithMeta({
          product: {
            id: 'product-1',
            name: 'Hafermilch',
            category: 'milk',
            images: [{ storagePath: 'product-a', sortOrder: 0 }],
          },
        }),
      })

      const image = wrapper.get('img')
      expect(image.attributes('src')).toContain('product-images/product-a')
      expect(image.attributes('alt')).toBe('Hafermilch')
    })
  })

  describe('given no images at all', () => {
    it('shows no image', () => {
      expect(mountCard().find('img').exists()).toBe(false)
    })
  })

  describe('given an author', () => {
    it('shows the author', () => {
      const wrapper = mountCard({ author: { id: 'user-2', username: 'gabel' } })

      expect(wrapper.text()).toMatch(/von\s*gabel/)
    })
  })

  describe('given slot content', () => {
    it('renders the leading control, the status and the actions', () => {
      const wrapper = mountCard(
        {},
        {
          leading: '<input type="checkbox" />',
          status: '<span>Veraltet</span>',
          actions: '<button>Löschen</button>',
        },
      )

      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Veraltet')
      expect(wrapper.get('.border-t').text()).toBe('Löschen')
    })
  })
})
