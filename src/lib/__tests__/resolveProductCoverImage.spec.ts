import { describe, expect, it } from 'vitest'
import { ImageBucket } from '@/config/imageBucket'
import { resolveProductCoverImage } from '../resolveProductCoverImage'

describe('resolveProductCoverImage', () => {
  describe('given no images', () => {
    it('has no cover image', () => {
      expect(resolveProductCoverImage([])).toBeNull()
    })
  })

  describe('given several images', () => {
    it('picks the one with the lowest sort order', () => {
      const images = [
        { storagePath: 'second', sortOrder: 2 },
        { storagePath: 'first', sortOrder: 0 },
        { storagePath: 'third', sortOrder: 5 },
      ]

      expect(resolveProductCoverImage(images)).toEqual({
        bucket: ImageBucket.Product,
        storagePath: 'first',
      })
    })

    it('does not reorder the given images', () => {
      const images = [
        { storagePath: 'second', sortOrder: 2 },
        { storagePath: 'first', sortOrder: 0 },
      ]

      resolveProductCoverImage(images)

      expect(images.map((image) => image.storagePath)).toEqual(['second', 'first'])
    })
  })
})
