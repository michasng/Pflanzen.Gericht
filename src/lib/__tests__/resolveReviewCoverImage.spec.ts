import { describe, expect, it } from 'vitest'
import { ImageBucket } from '@/config/imageBucket'
import { resolveReviewCoverImage } from '../resolveReviewCoverImage'

describe('resolveReviewCoverImage', () => {
  describe('given the review has images', () => {
    it('picks the first review image even if the product has images', () => {
      const cover = resolveReviewCoverImage({
        images: [
          { storagePath: 'review-b', sortOrder: 1 },
          { storagePath: 'review-a', sortOrder: 0 },
        ],
        product: { images: [{ storagePath: 'product-a', sortOrder: 0 }] },
      })

      expect(cover).toEqual({ bucket: ImageBucket.Review, storagePath: 'review-a' })
    })
  })

  describe('given the review has no images', () => {
    it('falls back to the first product image', () => {
      const cover = resolveReviewCoverImage({
        images: [],
        product: {
          images: [
            { storagePath: 'product-b', sortOrder: 1 },
            { storagePath: 'product-a', sortOrder: 0 },
          ],
        },
      })

      expect(cover).toEqual({ bucket: ImageBucket.Product, storagePath: 'product-a' })
    })
  })

  describe('given neither the review nor the product has images', () => {
    it('has no cover image', () => {
      expect(resolveReviewCoverImage({ images: [], product: { images: [] } })).toBeNull()
    })
  })
})
