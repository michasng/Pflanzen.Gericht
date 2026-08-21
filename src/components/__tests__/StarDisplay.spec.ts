import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarDisplay from '../StarDisplay.vue'

describe('StarDisplay', () => {
  it('renders 5 svg icons', () => {
    const wrapper = mount(StarDisplay, { props: { value: 3 } })
    expect(wrapper.findAll('svg')).toHaveLength(5)
  })

  it('highlights the correct number of stars', () => {
    const wrapper = mount(StarDisplay, { props: { value: 4 } })
    const highlighted = wrapper.findAll('svg').filter((s) => s.classes('text-amber-400'))
    expect(highlighted).toHaveLength(4)
  })

  it('shows all stars gray when value is null', () => {
    const wrapper = mount(StarDisplay, { props: { value: null } })
    const gray = wrapper.findAll('svg').filter((s) => s.classes('text-gray-200'))
    expect(gray).toHaveLength(5)
  })

  it('shows no highlighted stars when value is 0', () => {
    const wrapper = mount(StarDisplay, { props: { value: 0 } })
    const highlighted = wrapper.findAll('svg').filter((s) => s.classes('text-amber-400'))
    expect(highlighted).toHaveLength(0)
  })

  it('applies md size class when size is md', () => {
    const wrapper = mount(StarDisplay, { props: { value: 3, size: 'md' } })
    const svgs = wrapper.findAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    expect(svgs[0]?.classes()).toContain('w-5')
    expect(svgs[0]?.classes()).toContain('h-5')
  })
})
