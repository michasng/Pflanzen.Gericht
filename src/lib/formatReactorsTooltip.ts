import { REACTION_TOOLTIP_NAME_LIMIT } from '@/config/reactions'
import type { ReviewReaction } from '@/types/ReviewReaction'

export const formatReactorsTooltip = (reactors: readonly ReviewReaction[]): string => {
  const names = reactors
    .slice(0, REACTION_TOOLTIP_NAME_LIMIT)
    .map((reactor) => reactor.profile.displayName || reactor.profile.username)
  const remainingCount = reactors.length - names.length
  return remainingCount > 0
    ? [...names, `und ${remainingCount} weitere`].join('\n')
    : names.join('\n')
}
