import { describe, expect, it, vi } from 'vitest'
import { DOMWrapper, mount } from '@vue/test-utils'

vi.mock('@/services/catalog', () => ({
  getImageUrl: (bucket: string, path: string, size: string) =>
    `https://cdn.test/${bucket}/${path}/${size}.webp`,
}))

import RatingImageGallery from '@/components/RatingImageGallery.vue'
import type { RatingImage } from '@/types'

const images: RatingImage[] = [
  {
    created_at: '2024-01-01T00:00:00Z',
    id: 'image-1',
    rating_id: 'rating-1',
    sort_order: 0,
    storage_path: 'photo-1.webp',
  },
  {
    created_at: '2024-01-01T00:00:00Z',
    id: 'image-2',
    rating_id: 'rating-1',
    sort_order: 1,
    storage_path: 'photo-2.webp',
  },
]

describe('RatingImageGallery', () => {
  describe('given a rating without images', () => {
    it('renders nothing', () => {
      const wrapper = mount(RatingImageGallery, { props: { images: [] } })

      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  describe('given a rating with images', () => {
    it('shows a preview for each image', () => {
      const wrapper = mount(RatingImageGallery, { props: { images } })

      expect(wrapper.findAll('img')).toHaveLength(2)
    })

    it('sorts previews by sort order', () => {
      const wrapper = mount(RatingImageGallery, {
        props: { images: [...images].reverse() },
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
      const wrapper = mount(RatingImageGallery, { props: { images } })

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    describe('when a preview is clicked', () => {
      it('opens a dialog with the full-size image', async () => {
        const wrapper = mount(RatingImageGallery, { props: { images }, attachTo: document.body })

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
        const wrapper = mount(RatingImageGallery, { props: { images }, attachTo: document.body })
        await wrapper.find('button').trigger('click')

        await new DOMWrapper(document.body).find('[aria-label="Schließen"]').trigger('click')

        expect(new DOMWrapper(document.body).find('[role="dialog"]').exists()).toBe(false)

        wrapper.unmount()
      })
    })
  })
})
