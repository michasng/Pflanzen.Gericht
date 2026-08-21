import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { RouterView } from 'vue-router'
import App from '../App.vue'

describe('App', () => {
  it('renders RouterView', () => {
    const wrapper = mount(App, {
      global: {
        stubs: { RouterView: true },
      },
    })
    expect(wrapper.findComponent(RouterView).exists()).toBe(true)
  })
})
