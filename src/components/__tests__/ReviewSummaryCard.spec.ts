import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReviewSummaryCard from '@/components/ReviewSummaryCard.vue'
import { createReviewWithMeta } from '@/__tests__/createReviewWithMeta'

const mountCard = (
  props: { author?: { id: string; username: string } } = {},
  slots: Record<string, string> = {},
) =>
  mount(ReviewSummaryCard, {
    props: { review: createReviewWithMeta({ comment: 'Lecker' }), ...props },
    slots,
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, StarDisplay: true } },
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
