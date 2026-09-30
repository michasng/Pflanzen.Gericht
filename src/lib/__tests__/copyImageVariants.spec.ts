import { describe, expect, it } from 'vitest'
import { copyImageVariants } from '../copyImageVariants'

describe('copyImageVariants', () => {
  describe('given all copies succeed', () => {
    it('copies every variant to the destination', async () => {
      const copies: string[] = []

      await copyImageVariants(
        {
          copyVariant: async (source, destination) => {
            copies.push(`${source}>${destination}`)
            return { error: null }
          },
          removeVariants: async () => undefined,
        },
        'old',
        'new',
      )

      expect(copies).toEqual([
        'old/thumbnail.webp>new/thumbnail.webp',
        'old/preview.webp>new/preview.webp',
        'old/large.webp>new/large.webp',
      ])
    })
  })

  describe('given a later copy fails', () => {
    it('removes the variants copied so far and rethrows', async () => {
      const removed: string[][] = []
      const failure = new Error('copy failed')
      let calls = 0

      const result = copyImageVariants(
        {
          copyVariant: async () => ({ error: ++calls === 2 ? failure : null }),
          removeVariants: async (paths) => {
            removed.push(paths)
          },
        },
        'old',
        'new',
      )

      await expect(result).rejects.toBe(failure)
      expect(removed).toEqual([['new/thumbnail.webp']])
    })
  })
})
