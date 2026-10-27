import { describe, expect, it } from 'vitest'
import { createDeferred } from '@/__tests__/createDeferred'
import { createFakeProductDetailGateway } from '@/__tests__/createFakeProductDetailGateway'
import { createReviewReaction } from '@/__tests__/createReviewReaction'
import type { ReviewReaction } from '@/types/ReviewReaction'
import { useReviewReactions } from '../useReviewReactions'

const USER_ID = 'me'
const PROFILE = { username: 'me', displayName: 'Ich' }

const createSavedReaction = (emoji: string): ReviewReaction =>
  createReviewReaction({
    emoji,
    userId: USER_ID,
    profile: PROFILE,
    createdAt: '2026-09-12T00:00:00.000Z',
  })

const createReactions = ({
  initialReactions = [] as readonly ReviewReaction[],
  currentUserId = USER_ID as string | null,
  gateway = createFakeProductDetailGateway({
    addReaction: (_reviewId, _userId, emoji) => Promise.resolve(createSavedReaction(emoji)),
  }),
} = {}) =>
  useReviewReactions({
    gateway,
    reviewId: 'review-1',
    currentUserId: () => currentUserId,
    currentUserProfile: () => (currentUserId ? PROFILE : null),
    initialReactions,
  })

describe('useReviewReactions', () => {
  describe('when toggling an unused emoji', () => {
    it('adds the saved reaction', async () => {
      const addCalls: unknown[][] = []
      const { reactions, toggle } = createReactions({
        gateway: createFakeProductDetailGateway({
          addReaction: (...args) => {
            addCalls.push(args)
            return Promise.resolve(createSavedReaction('👍'))
          },
        }),
      })

      await toggle('👍')

      expect(addCalls).toEqual([['review-1', USER_ID, '👍']])
      expect(reactions.value).toEqual([createSavedReaction('👍')])
    })

    it('shows the reaction and disables the emoji while saving', async () => {
      const saving = createDeferred<ReviewReaction>()
      const { reactions, pendingEmojis, toggle } = createReactions({
        gateway: createFakeProductDetailGateway({ addReaction: () => saving.promise }),
      })

      const pendingToggle = toggle('👍')

      expect(reactions.value.map((reaction) => reaction.emoji)).toEqual(['👍'])
      expect(pendingEmojis.value).toEqual(['👍'])
      saving.resolve(createSavedReaction('👍'))
      await pendingToggle
      expect(pendingEmojis.value).toEqual([])
    })

    it('ignores a second toggle while the first is saving', async () => {
      const saving = createDeferred<ReviewReaction>()
      let addCount = 0
      const { toggle } = createReactions({
        gateway: createFakeProductDetailGateway({
          addReaction: () => {
            addCount += 1
            return saving.promise
          },
        }),
      })

      const firstToggle = toggle('👍')
      await toggle('👍')
      saving.resolve(createSavedReaction('👍'))
      await firstToggle

      expect(addCount).toBe(1)
    })

    it('adds a second, different emoji alongside', async () => {
      const { reactions, toggle } = createReactions()

      await toggle('👍')
      await toggle('🎉')

      expect(reactions.value.map((reaction) => reaction.emoji)).toEqual(['👍', '🎉'])
    })

    it('rolls back and reports the error when saving fails', async () => {
      const { reactions, errorMessage, toggle } = createReactions({
        gateway: createFakeProductDetailGateway({
          addReaction: () => Promise.reject(new Error('Speichern fehlgeschlagen')),
        }),
      })

      await toggle('👍')

      expect(reactions.value).toEqual([])
      expect(errorMessage.value).toBe('Speichern fehlgeschlagen')
    })
  })

  describe('when toggling an emoji the user already used', () => {
    it('removes the reaction through the gateway', async () => {
      const removeCalls: unknown[][] = []
      const { reactions, toggle } = createReactions({
        initialReactions: [createSavedReaction('👍')],
        gateway: createFakeProductDetailGateway({
          removeReaction: (...args) => {
            removeCalls.push(args)
            return Promise.resolve()
          },
        }),
      })

      await toggle('👍')

      expect(removeCalls).toEqual([['review-1', USER_ID, '👍']])
      expect(reactions.value).toEqual([])
    })

    it('restores the reaction at its position and reports the error when removing fails', async () => {
      const first = createSavedReaction('👍')
      const second = createSavedReaction('🎉')
      const { reactions, errorMessage, toggle } = createReactions({
        initialReactions: [first, second],
        gateway: createFakeProductDetailGateway({
          removeReaction: () => Promise.reject(new Error('Löschen fehlgeschlagen')),
        }),
      })

      await toggle('👍')

      expect(reactions.value).toEqual([first, second])
      expect(errorMessage.value).toBe('Löschen fehlgeschlagen')
    })
  })

  describe('given an emoji only someone else used', () => {
    it('adds the current user as an additional reactor', async () => {
      const other = createReviewReaction({ emoji: '👍', userId: 'other' })
      const { reactions, toggle } = createReactions({ initialReactions: [other] })

      await toggle('👍')

      expect(reactions.value).toEqual([other, createSavedReaction('👍')])
    })
  })

  describe('given no current user', () => {
    it('does nothing', async () => {
      const { reactions, errorMessage, toggle } = createReactions({ currentUserId: null })

      await toggle('👍')

      expect(reactions.value).toEqual([])
      expect(errorMessage.value).toBeNull()
    })
  })
})
