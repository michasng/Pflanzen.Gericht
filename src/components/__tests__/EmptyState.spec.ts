import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('renders the description when given', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'Nichts gefunden', description: 'Versuche es erneut.' },
    })
    expect(wrapper.text()).toContain('Versuche es erneut.')
  })

  it('does not render a description paragraph when none is given', () => {
    const wrapper = mount(EmptyState, { props: { title: 'Nichts gefunden' } })
    expect(wrapper.findAll('p')).toHaveLength(1)
  })

  it('renders only the title without icon when compact', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'Nichts gefunden', description: 'Versuche es erneut.', compact: true },
    })
    expect(wrapper.text()).toBe('Nichts gefunden')
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
