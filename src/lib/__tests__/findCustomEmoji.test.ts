import { describe, expect, it } from 'vitest'
import { findCustomEmoji } from '@/lib/findCustomEmoji'

describe('findCustomEmoji', () => {
  const logo = { name: 'Logo', url: '/logo.svg' }

  describe('given a name of a custom emoji', () => {
    it('returns the custom emoji', () => {
      expect(findCustomEmoji('Logo', [logo])).toBe(logo)
    })
  })

  describe('given a native emoji', () => {
    it('returns undefined', () => {
      expect(findCustomEmoji('👍', [logo])).toBeUndefined()
    })
  })
})
