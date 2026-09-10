import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BadgeComponent from '../BadgeComponent.vue'

describe('BadgeComponent', () => {
  it('renders the count when greater than 0', () => {
    const wrapper = mount(BadgeComponent, { props: { count: 3 } })
    expect(wrapper.text()).toContain('3')
  })

  it('renders nothing when count is 0', () => {
    const wrapper = mount(BadgeComponent, { props: { count: 0 } })
    expect(wrapper.find('span').exists()).toBe(false)
  })
})
