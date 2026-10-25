import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ToggleOption from '../ToggleOption.vue'

describe('ToggleOption', () => {
  describe('given it is pressed', () => {
    it('announces the state and shows a checkmark', () => {
      const wrapper = mount(ToggleOption, { props: { pressed: true }, slots: { default: 'Liste' } })

      expect(wrapper.attributes('aria-pressed')).toBe('true')
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(wrapper.text()).toBe('Liste')
    })
  })

  describe('given it is not pressed', () => {
    it('announces the state without a checkmark', () => {
      const wrapper = mount(ToggleOption, { props: { pressed: false } })

      expect(wrapper.attributes('aria-pressed')).toBe('false')
      expect(wrapper.find('svg').exists()).toBe(false)
    })
  })

  describe('given it is disabled', () => {
    it('disables the button', () => {
      const wrapper = mount(ToggleOption, { props: { pressed: false, disabled: true } })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })
  })
})
