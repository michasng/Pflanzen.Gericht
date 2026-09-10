import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ButtonComponent from '../ButtonComponent.vue'
import { ButtonVariant } from '../ButtonVariant'
import { ButtonSize } from '../ButtonSize'
import { ButtonTone } from '../ButtonTone'

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

  it('applies a compact size without needing important overrides', () => {
    const wrapper = mount(ButtonComponent, {
      props: {
        variant: ButtonVariant.Outlined,
        size: ButtonSize.Compact,
        ariaLabel: DEFAULT_ARIA_LABEL,
      },
    })
    expect(wrapper.classes()).toContain('px-3')
    expect(wrapper.classes()).not.toContain('px-4')
  })

  it('applies the danger tone class when given', () => {
    const wrapper = mount(ButtonComponent, {
      props: {
        variant: ButtonVariant.Text,
        tone: ButtonTone.Danger,
        ariaLabel: DEFAULT_ARIA_LABEL,
      },
    })
    expect(wrapper.classes()).toContain('text-red-500')
    expect(wrapper.classes()).not.toContain('text-primary-600')
  })

  it('grows to fill its container when fullWidth is set', () => {
    const wrapper = mount(ButtonComponent, {
      props: { fullWidth: true, ariaLabel: DEFAULT_ARIA_LABEL },
    })
    expect(wrapper.classes()).toContain('w-full')
    expect(wrapper.classes()).toContain('flex-1')
  })

  it('does not stretch by default', () => {
    const wrapper = mount(ButtonComponent, { props: { ariaLabel: DEFAULT_ARIA_LABEL } })
    expect(wrapper.classes()).not.toContain('w-full')
  })
})
