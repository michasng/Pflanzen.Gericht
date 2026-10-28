import type { CustomEmoji } from '@/types/CustomEmoji'

export const LOGO_EMOJI_NAME = 'Pflanzen.Gericht'

export const CUSTOM_EMOJIS: readonly CustomEmoji[] = [
  { name: LOGO_EMOJI_NAME, url: `${import.meta.env.BASE_URL}favicon.svg` },
]
