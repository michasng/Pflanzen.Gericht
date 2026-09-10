import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ButtonComponent from '../ButtonComponent.vue'
import { ButtonVariant } from '../ButtonVariant'

describe('ButtonComponent', () => {
  const DEFAULT_ARIA_LABEL = 'Aktion'

  it('applies the filled variant class by default', () => {
    const wrapper = mount(ButtonComponent, { props: { ariaLabel: DEFAULT_ARIA_LABEL } })
    expect(wrapper.classes()).toContain('bg-primary-600')
  })

  it('applies the outlined variant class when given', () => {
    const wrapper = mount(ButtonComponent, {
      props: { variant: ButtonVariant.Outlined, ariaLabel: DEFAULT_ARIA_LABEL },
    })
    expect(wrapper.classes()).toContain('border-gray-200')
  })

  it('applies the text variant class when given', () => {
    const wrapper = mount(ButtonComponent, {
      props: { variant: ButtonVariant.Text, ariaLabel: DEFAULT_ARIA_LABEL },
    })
    expect(wrapper.classes()).toContain('text-primary-600')
  })

  it('applies the icon variant class when given', () => {
    const wrapper = mount(ButtonComponent, {
      props: { variant: ButtonVariant.Icon, ariaLabel: DEFAULT_ARIA_LABEL },
    })
    expect(wrapper.classes()).toContain('rounded-full')
  })

  it('disables the button when disabled is true', () => {
    const wrapper = mount(ButtonComponent, {
      props: { disabled: true, ariaLabel: DEFAULT_ARIA_LABEL },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('does not disable the button by default', () => {
    const wrapper = mount(ButtonComponent, { props: { ariaLabel: DEFAULT_ARIA_LABEL } })
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })
})
