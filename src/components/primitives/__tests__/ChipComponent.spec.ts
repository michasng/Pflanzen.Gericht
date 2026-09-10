import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChipComponent from '../ChipComponent.vue'
import { ChipSize } from '../ChipSize'
import { ChipTone } from '../ChipTone'

describe('ChipComponent', () => {
  it('renders a span when not interactive', () => {
    const wrapper = mount(ChipComponent)
    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('renders a button when interactive', () => {
    const wrapper = mount(ChipComponent, { props: { interactive: true } })
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('exposes aria-pressed for interactive chips', () => {
    const wrapper = mount(ChipComponent, { props: { interactive: true, selected: true } })
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('applies the selected style when selected', () => {
    const wrapper = mount(ChipComponent, { props: { selected: true } })
    expect(wrapper.classes()).toContain('bg-primary-50')
  })

  it('applies the neutral style when not selected', () => {
    const wrapper = mount(ChipComponent)
    expect(wrapper.classes()).toContain('bg-gray-100')
  })

  it('shows a remove button when removable', () => {
    const wrapper = mount(ChipComponent, { props: { removable: true } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('does not show a remove button by default', () => {
    const wrapper = mount(ChipComponent)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('applies the danger tone style when set', () => {
    const wrapper = mount(ChipComponent, { props: { tone: ChipTone.Danger } })
    expect(wrapper.classes()).toContain('bg-red-50')
  })

  it('applies compact spacing when set', () => {
    const wrapper = mount(ChipComponent, { props: { size: ChipSize.Compact } })
    expect(wrapper.classes()).toContain('px-2')
  })

  it('applies a wider spacing to interactive chips when set', () => {
    const wrapper = mount(ChipComponent, {
      props: { interactive: true, size: ChipSize.Wide },
    })
    expect(wrapper.classes()).toContain('px-4')
  })

  it('emits remove when the remove button is clicked', async () => {
    const wrapper = mount(ChipComponent, { props: { removable: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})
