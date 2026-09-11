import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageComponent from '../ImageComponent.vue'

describe('ImageComponent', () => {
  it('renders the image with the given src and alt', () => {
    const wrapper = mount(ImageComponent, { props: { src: '/photo.jpg', alt: 'A photo' } })
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/photo.jpg')
    expect(img.attributes('alt')).toBe('A photo')
  })

  it('scales the image to fit without cropping', () => {
    const wrapper = mount(ImageComponent, { props: { src: '/photo.jpg', alt: 'A photo' } })
    expect(wrapper.find('img').classes()).toContain('object-contain')
  })

  it('keeps a square aspect ratio with a white background', () => {
    const wrapper = mount(ImageComponent, { props: { src: '/photo.jpg', alt: 'A photo' } })
    expect(wrapper.classes()).toContain('aspect-square')
    expect(wrapper.classes()).toContain('bg-white')
  })

  it('forwards loading when provided', () => {
    const wrapper = mount(ImageComponent, {
      props: { src: '/photo.jpg', alt: 'A photo', loading: 'lazy' },
    })
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
  })
})
