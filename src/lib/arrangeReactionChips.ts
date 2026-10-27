import type { ReactionChip } from '@/types/ReactionChip'
import type { ReviewReaction } from '@/types/ReviewReaction'

export interface ArrangedReactionChips {
  visibleChips: readonly ReactionChip[]
  hiddenChips: readonly ReactionChip[]
}

interface ArrangeReactionChipsOptions {
  reactions: readonly ReviewReaction[]
  currentUserId: string | null
  quickEmojis: readonly string[]
  visibleExtraLimit: number
}

export const arrangeReactionChips = ({
  reactions,
  currentUserId,
  quickEmojis,
  visibleExtraLimit,
}: ArrangeReactionChipsOptions): ArrangedReactionChips => {
  const reactorsByEmoji = new Map<string, ReviewReaction[]>()
  for (const reaction of reactions) {
    const reactors = reactorsByEmoji.get(reaction.emoji) ?? []
    reactors.push(reaction)
    reactorsByEmoji.set(reaction.emoji, reactors)
  }

  const toChip = (emoji: string): ReactionChip => {
    const reactors = reactorsByEmoji.get(emoji) ?? []
    return {
      emoji,
      count: reactors.length,
      isMine:
        currentUserId !== null && reactors.some((reactor) => reactor.userId === currentUserId),
      reactors,
    }
  }

  const quickChips = quickEmojis
    .map(toChip)
    .filter((chip) => currentUserId !== null || chip.count > 0)
  const extraChips = [...reactorsByEmoji.keys()]
    .filter((emoji) => !quickEmojis.includes(emoji))
    .map(toChip)
  const ownExtraChips = extraChips.filter((chip) => chip.isMine)
  const otherExtraChips = extraChips.filter((chip) => !chip.isMine)
  const otherVisibleCount = Math.max(0, visibleExtraLimit - ownExtraChips.length)

  return {
    visibleChips: [...quickChips, ...ownExtraChips, ...otherExtraChips.slice(0, otherVisibleCount)],
    hiddenChips: otherExtraChips.slice(otherVisibleCount),
  }
}
