import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
vi.mock('@/services/catalog', () => ({
  getImageUrl: (bucket: string, path: string) => `${bucket}/${path}`,
}))

import ImageCopyPicker from '../ImageCopyPicker.vue'

const mountPicker = () =>
  mount(ImageCopyPicker, {
    props: {
      title: 'Bilder',
      bucket: 'review-images',
      groups: [{ label: 'Anna', images: [{ id: 'a', storage_path: 'u/r/a' }] }],
    },
  })

describe('ImageCopyPicker', () => {
  describe('given an image is selected', () => {
    it('when toggled again, emits the selection without it', async () => {
      const wrapper = mountPicker()
      const button = wrapper.get('button')

      await button.trigger('click')
      await button.trigger('click')

      expect(wrapper.emitted('change')).toEqual([[['a']], [[]]])
    })
  })

  describe('given no groups', () => {
    it('when rendered, shows nothing', () => {
      const wrapper = mount(ImageCopyPicker, {
        props: { title: 'Bilder', bucket: 'review-images', groups: [] },
      })

      expect(wrapper.find('button').exists()).toBe(false)
    })
  })
})
