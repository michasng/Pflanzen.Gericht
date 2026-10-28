import type { CustomEmoji } from '@/types/CustomEmoji'

export const findCustomEmoji = (
  name: string,
  customEmojis: readonly CustomEmoji[],
): CustomEmoji | undefined => customEmojis.find((customEmoji) => customEmoji.name === name)
