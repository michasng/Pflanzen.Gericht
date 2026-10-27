import type { ReviewReaction } from '@/types/ReviewReaction'

export interface ReactionChip {
  emoji: string
  count: number
  isMine: boolean
  reactors: readonly ReviewReaction[]
}
