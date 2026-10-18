import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createFakeImageUrlGateway } from '@/__tests__/createFakeImageUrlGateway'
import { imageUrlGatewayKey } from '@/services/ImageUrlGateway'
import ImageCopyPicker from '../ImageCopyPicker.vue'

const provide = { [imageUrlGatewayKey]: createFakeImageUrlGateway() }

const mountPicker = () =>
  mount(ImageCopyPicker, {
    props: {
      title: 'Bilder',
      bucket: 'review-images',
      groups: [{ label: 'Anna', images: [{ id: 'a', storagePath: 'u/r/a' }] }],
    },
    global: { provide },
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
        global: { provide },
      })

      expect(wrapper.find('button').exists()).toBe(false)
    })
  })
})
