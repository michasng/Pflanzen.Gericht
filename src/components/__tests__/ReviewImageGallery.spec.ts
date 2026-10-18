import { describe, expect, it } from 'vitest'
import { DOMWrapper, mount } from '@vue/test-utils'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import ReviewImageGallery from '@/components/ReviewImageGallery.vue'
import type { ReviewImage } from '@/types'

const global = { provide: { [imageUrlGatewayKey]: createFakeImageUrlGateway() } }

const images: ReviewImage[] = [
  {
    createdAt: '2024-01-01T00:00:00Z',
    id: 'image-1',
    reviewId: 'review-1',
    sortOrder: 0,
    storagePath: 'photo-1.webp',
  },
  {
    createdAt: '2024-01-01T00:00:00Z',
    id: 'image-2',
    reviewId: 'review-1',
    sortOrder: 1,
    storagePath: 'photo-2.webp',
  },
]

describe('ReviewImageGallery', () => {
  describe('given a review without images', () => {
    it('renders nothing', () => {
      const wrapper = mount(ReviewImageGallery, { props: { images: [] }, global })

      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  describe('given a review with images', () => {
    it('shows a preview for each image', () => {
      const wrapper = mount(ReviewImageGallery, { props: { images }, global })

      expect(wrapper.findAll('img')).toHaveLength(2)
    })

    it('sorts previews by sort order', () => {
      const wrapper = mount(ReviewImageGallery, {
        props: { images: [...images].reverse() },
        global,
      })

      const previewImages = wrapper.findAll('img')
      expect(previewImages[0]?.attributes('src')).toBe(
        'https://cdn.test/review-images/photo-1.webp/thumbnail.webp',
      )
      expect(previewImages[1]?.attributes('src')).toBe(
        'https://cdn.test/review-images/photo-2.webp/thumbnail.webp',
      )
    })

    it('does not show the enlarged dialog initially', () => {
      const wrapper = mount(ReviewImageGallery, { props: { images }, global })

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    describe('when a preview is clicked', () => {
      it('opens a dialog with the full-size image', async () => {
        const wrapper = mount(ReviewImageGallery, {
          props: { images },
          global,
          attachTo: document.body,
        })

        await wrapper.find('button').trigger('click')

        const dialog = new DOMWrapper(document.body).find('[role="dialog"]')
        expect(dialog.exists()).toBe(true)
        expect(dialog.find('img').attributes('src')).toBe(
          'https://cdn.test/review-images/photo-1.webp/large.webp',
        )

        wrapper.unmount()
      })
    })

    describe('when the dialog close button is clicked', () => {
      it('closes the dialog', async () => {
        const wrapper = mount(ReviewImageGallery, {
          props: { images },
          global,
          attachTo: document.body,
        })
        await wrapper.find('button').trigger('click')

        await new DOMWrapper(document.body).find('[aria-label="Schließen"]').trigger('click')

        expect(new DOMWrapper(document.body).find('[role="dialog"]').exists()).toBe(false)

        wrapper.unmount()
      })
    })
  })
})
