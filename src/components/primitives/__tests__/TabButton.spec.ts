import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabButton from '../TabButton.vue'

describe('TabButton', () => {
  const DEFAULT_ARIA_LABEL = 'Meine Produkte'

  it('applies the inactive style by default', () => {
    const wrapper = mount(TabButton, { props: { ariaLabel: DEFAULT_ARIA_LABEL } })
    expect(wrapper.classes()).toContain('text-gray-500')
  })

  it('applies the active style when active', () => {
    const wrapper = mount(TabButton, {
      props: { active: true, ariaLabel: DEFAULT_ARIA_LABEL },
    })
    expect(wrapper.classes()).toContain('text-primary-600')
    expect(wrapper.classes()).toContain('border-primary-600')
  })

  it('emits click when pressed', async () => {
    const wrapper = mount(TabButton, { props: { ariaLabel: DEFAULT_ARIA_LABEL } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
