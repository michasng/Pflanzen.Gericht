import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../ProgressBar.vue'
import { ProgressBarColor } from '../ProgressBarColor'

describe('ProgressBar', () => {
  it('sets the fill width to the given percent', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 42 } })
    expect(wrapper.find('.h-full').attributes('style')).toContain('width: 42%')
  })

  it('clamps the fill width to 100 when percent exceeds the maximum', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 150 } })
    expect(wrapper.find('.h-full').attributes('style')).toContain('width: 100%')
  })

  it('clamps the fill width to 0 when percent is negative', () => {
    const wrapper = mount(ProgressBar, { props: { percent: -10 } })
    expect(wrapper.find('.h-full').attributes('style')).toContain('width: 0%')
  })

  it('applies the primary color by default', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 50 } })
    expect(wrapper.find('.h-full').classes()).toContain('bg-primary-500')
  })

  it('applies the amber color when given', () => {
    const wrapper = mount(ProgressBar, {
      props: { percent: 50, color: ProgressBarColor.Amber },
    })
    expect(wrapper.find('.h-full').classes()).toContain('bg-amber-400')
  })
})
