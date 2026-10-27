import { REACTION_COUNT_CAP } from '@/config/reactions'

export const formatReactionCount = (count: number): string => {
  if (count <= 1) return ''
  if (count > REACTION_COUNT_CAP) return `${REACTION_COUNT_CAP}+`
  return String(count)
}
