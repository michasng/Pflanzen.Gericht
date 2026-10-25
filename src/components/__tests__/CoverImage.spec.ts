import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CoverImage from '@/components/CoverImage.vue'
import { ImageBucket } from '@/config/imageBucket'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import type { CoverImageSource } from '@/lib/CoverImageSource'

const mountCoverImage = (source: CoverImageSource | null) =>
  mount(CoverImage, {
    props: { source, alt: 'Hafermilch' },
    global: { provide: { [imageUrlGatewayKey]: createFakeImageUrlGateway() } },
  })

describe('CoverImage', () => {
  describe('given a source', () => {
    it('shows the thumbnail with the alt text', () => {
      const wrapper = mountCoverImage({ bucket: ImageBucket.Product, storagePath: 'u/p/1' })

      const image = wrapper.get('img')
      expect(image.attributes('src')).toBe('https://cdn.test/product-images/u/p/1/thumbnail.webp')
      expect(image.attributes('alt')).toBe('Hafermilch')
    })
  })

  describe('given no source', () => {
    it('shows a placeholder square without an image', () => {
      const wrapper = mountCoverImage(null)

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.classes()).toContain('h-16')
    })
  })
})
