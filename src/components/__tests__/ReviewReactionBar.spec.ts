import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmojiPickerDialog from '@/components/EmojiPickerDialog.vue'
import ReviewReactionBar from '@/components/ReviewReactionBar.vue'
import { createFakeProductDetailGateway } from '@/__tests__/createFakeProductDetailGateway'
import { createReviewReaction } from '@/__tests__/createReviewReaction'
import { productDetailGatewayKey, type ProductDetailGateway } from '@/services/ProductDetailGateway'
import type { ReviewReaction } from '@/types/ReviewReaction'

const USER_ID = 'me'
const PROFILE = { username: 'me', displayName: 'Ich' }

interface MountOptions {
  reactions?: readonly ReviewReaction[]
  signedIn?: boolean
  gateway?: ProductDetailGateway
}

const mountBar = ({
  reactions = [],
  signedIn = true,
  gateway = createFakeProductDetailGateway({
    addReaction: (_reviewId, userId, emoji) =>
      Promise.resolve(createReviewReaction({ emoji, userId, profile: PROFILE })),
  }),
}: MountOptions = {}) =>
  mount(ReviewReactionBar, {
    props: {
      reviewId: 'review-1',
      initialReactions: reactions,
      currentUserId: signedIn ? USER_ID : null,
      currentUserProfile: signedIn ? PROFILE : null,
    },
    global: {
      provide: { [productDetailGatewayKey]: gateway },
      stubs: { EmojiPickerDialog: true },
    },
  })

const emojiButtons = (wrapper: ReturnType<typeof mountBar>) =>
  wrapper.findAll('button[aria-label*=","]')

describe('ReviewReactionBar', () => {
  describe('given a signed-in user', () => {
    it('shows the quick emojis and the picker button', () => {
      const wrapper = mountBar()

      expect(emojiButtons(wrapper).map((button) => button.attributes('aria-label'))).toEqual([
        '👍, keine Reaktionen',
        '👎, keine Reaktionen',
        '😂, keine Reaktionen',
      ])
      expect(wrapper.find('button[aria-label="Emoji auswählen"]').exists()).toBe(true)
    })

    it('when tapping an emoji then sends the reaction and highlights it', async () => {
      const addCalls: unknown[][] = []
      const wrapper = mountBar({
        gateway: createFakeProductDetailGateway({
          addReaction: (...args) => {
            addCalls.push(args)
            return Promise.resolve(createReviewReaction({ emoji: '👍', userId: USER_ID }))
          },
        }),
      })

      await emojiButtons(wrapper)[0]?.trigger('click')

      expect(addCalls).toEqual([['review-1', USER_ID, '👍']])
      expect(emojiButtons(wrapper)[0]?.attributes('aria-label')).toBe(
        '👍, 1 Reaktionen, von dir ausgewählt',
      )
    })

    it('when saving fails then shows the error', async () => {
      const wrapper = mountBar({
        gateway: createFakeProductDetailGateway({
          addReaction: () => Promise.reject(new Error('Speichern fehlgeschlagen')),
        }),
      })

      await emojiButtons(wrapper)[0]?.trigger('click')

      expect(wrapper.text()).toContain('Speichern fehlgeschlagen')
    })

    it('when picking an emoji from the picker then reacts with it', async () => {
      const wrapper = mountBar()
      await wrapper.get('button[aria-label="Emoji auswählen"]').trigger('click')

      wrapper.getComponent(EmojiPickerDialog).vm.$emit('pick', '🎉')

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('🎉')
    })

    it('when the picker closes then removes it', async () => {
      const wrapper = mountBar()
      await wrapper.get('button[aria-label="Emoji auswählen"]').trigger('click')

      wrapper.getComponent(EmojiPickerDialog).vm.$emit('close')

      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent(EmojiPickerDialog).exists()).toBe(false)
    })
  })

  describe('given more other emojis than fit', () => {
    const manyReactions = ['🎉', '🔥', '🍕', '🌱', '🥑', '🍓', '🍋'].map((emoji) =>
      createReviewReaction({ emoji, userId: 'other' }),
    )

    it('collapses the rest into a chip that expands in place', async () => {
      const wrapper = mountBar({ reactions: manyReactions })
      expect(wrapper.text()).not.toContain('🍋')

      await wrapper.get('button[aria-label="2 weitere Reaktionen anzeigen"]').trigger('click')

      expect(wrapper.text()).toContain('🍋')
      expect(wrapper.find('button[aria-label$="anzeigen"]').exists()).toBe(false)
    })
  })

  describe('given a visitor who is not signed in', () => {
    it('shows only used emojis without any interaction', () => {
      const wrapper = mountBar({
        signedIn: false,
        reactions: [createReviewReaction({ emoji: '😂' })],
      })

      expect(wrapper.text()).toContain('😂')
      expect(wrapper.text()).not.toContain('👍')
      expect(wrapper.find('button').exists()).toBe(false)
    })
  })
})
