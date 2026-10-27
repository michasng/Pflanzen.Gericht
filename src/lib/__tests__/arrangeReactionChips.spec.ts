import { describe, expect, it } from 'vitest'
import { createReviewReaction } from '@/__tests__/createReviewReaction'
import { arrangeReactionChips } from '../arrangeReactionChips'

const QUICK_EMOJIS = ['👍', '👎', '😂']
const ME = 'me'

const arrange = (
  reactions: Parameters<typeof arrangeReactionChips>[0]['reactions'],
  currentUserId: string | null = ME,
  visibleExtraLimit = 2,
) =>
  arrangeReactionChips({ reactions, currentUserId, quickEmojis: QUICK_EMOJIS, visibleExtraLimit })

const emojisOf = (chips: readonly { emoji: string }[]) => chips.map((chip) => chip.emoji)

describe('arrangeReactionChips', () => {
  describe('given no reactions', () => {
    it('shows the quick emojis with zero count for a signed-in user', () => {
      const { visibleChips, hiddenChips } = arrange([])

      expect(visibleChips.map((chip) => [chip.emoji, chip.count, chip.isMine])).toEqual([
        ['👍', 0, false],
        ['👎', 0, false],
        ['😂', 0, false],
      ])
      expect(hiddenChips).toEqual([])
    })

    it('shows nothing for a signed-out viewer', () => {
      expect(arrange([], null).visibleChips).toEqual([])
    })
  })

  describe('given reactions on quick emojis', () => {
    it('keeps the quick emojis in fixed order and counts them', () => {
      const { visibleChips } = arrange([
        createReviewReaction({ emoji: '😂', userId: 'a' }),
        createReviewReaction({ emoji: '👍', userId: 'b' }),
        createReviewReaction({ emoji: '👍', userId: 'c' }),
      ])

      expect(visibleChips.map((chip) => [chip.emoji, chip.count])).toEqual([
        ['👍', 2],
        ['👎', 0],
        ['😂', 1],
      ])
    })

    it('flags the emojis the current user used', () => {
      const { visibleChips } = arrange([
        createReviewReaction({ emoji: '👎', userId: ME }),
        createReviewReaction({ emoji: '👍', userId: 'a' }),
      ])

      expect(visibleChips.map((chip) => chip.isMine)).toEqual([false, true, false])
    })

    it('lists the reactors in reaction order', () => {
      const first = createReviewReaction({ userId: 'a' })
      const second = createReviewReaction({ userId: 'b' })

      const { visibleChips } = arrange([first, second])

      expect(visibleChips[0]?.reactors).toEqual([first, second])
    })

    it('only shows the used quick emojis to a signed-out viewer', () => {
      const { visibleChips } = arrange([createReviewReaction({ emoji: '😂' })], null)

      expect(emojisOf(visibleChips)).toEqual(['😂'])
    })
  })

  describe('given reactions on other emojis', () => {
    it('shows them after the quick emojis in first-use order', () => {
      const { visibleChips } = arrange([
        createReviewReaction({ emoji: '🎉', userId: 'a' }),
        createReviewReaction({ emoji: '🔥', userId: 'b' }),
        createReviewReaction({ emoji: '🎉', userId: 'c' }),
      ])

      expect(emojisOf(visibleChips)).toEqual(['👍', '👎', '😂', '🎉', '🔥'])
    })

    it("puts the user's own emojis before others'", () => {
      const { visibleChips } = arrange([
        createReviewReaction({ emoji: '🎉', userId: 'a' }),
        createReviewReaction({ emoji: '🔥', userId: ME }),
      ])

      expect(emojisOf(visibleChips).slice(3)).toEqual(['🔥', '🎉'])
    })

    it('collapses emojis beyond the limit into the hidden chips', () => {
      const { visibleChips, hiddenChips } = arrange([
        createReviewReaction({ emoji: '🎉', userId: 'a' }),
        createReviewReaction({ emoji: '🔥', userId: 'a' }),
        createReviewReaction({ emoji: '🍕', userId: 'a' }),
      ])

      expect(emojisOf(visibleChips).slice(3)).toEqual(['🎉', '🔥'])
      expect(emojisOf(hiddenChips)).toEqual(['🍕'])
    })

    it('never hides own emojis even beyond the limit', () => {
      const { visibleChips, hiddenChips } = arrange([
        createReviewReaction({ emoji: '🎉', userId: 'a' }),
        createReviewReaction({ emoji: '🔥', userId: ME }),
        createReviewReaction({ emoji: '🍕', userId: ME }),
        createReviewReaction({ emoji: '🌱', userId: ME }),
      ])

      expect(emojisOf(visibleChips).slice(3)).toEqual(['🔥', '🍕', '🌱'])
      expect(emojisOf(hiddenChips)).toEqual(['🎉'])
    })
  })
})
