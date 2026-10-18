import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TabBar from '../TabBar.vue'

const tabs = [
  { value: 'first', label: 'Erste (2)', ariaLabel: 'Erste' },
  { value: 'second', label: 'Zweite', ariaLabel: 'Zweite' },
  { value: 'third', label: 'Dritte', ariaLabel: 'Dritte' },
]

const mountTabBar = (modelValue: string) => {
  const selected: string[] = []
  const wrapper = mount(TabBar, {
    props: {
      tabs,
      modelValue,
      'onUpdate:modelValue': (value: string) => selected.push(value),
    },
    attachTo: document.body,
  })
  return { wrapper, selected }
}

describe('TabBar', () => {
  describe('given a selected tab', () => {
    it('marks only that tab as selected and focusable', () => {
      const { wrapper } = mountTabBar('second')

      const tabElements = wrapper.findAll('[role="tab"]')
      expect(tabElements.map((tab) => tab.attributes('aria-selected'))).toEqual([
        'false',
        'true',
        'false',
      ])
      expect(tabElements.map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    })

    it('shows the labels', () => {
      const { wrapper } = mountTabBar('first')

      expect(wrapper.get('[role="tab"]').text()).toBe('Erste (2)')
      expect(wrapper.get('[role="tab"]').attributes('aria-label')).toBe('Erste')
    })
  })

  describe('when clicking a tab', () => {
    it('selects it', async () => {
      const { wrapper, selected } = mountTabBar('first')

      await wrapper.get('[aria-label="Dritte"]').trigger('click')

      expect(selected).toEqual(['third'])
    })
  })

  describe('when pressing keys on the tab list', () => {
    it.each([
      ['first', 'ArrowRight', 'second'],
      ['third', 'ArrowRight', 'first'],
      ['second', 'ArrowLeft', 'first'],
      ['first', 'ArrowLeft', 'third'],
      ['second', 'Home', 'first'],
      ['second', 'End', 'third'],
    ])('with %s selected, %s selects %s', async (current, key, expected) => {
      const { wrapper, selected } = mountTabBar(current)

      await wrapper.get('[role="tablist"]').trigger('keydown', { key })

      expect(selected).toEqual([expected])
    })

    it('moves the focus to the selected tab', async () => {
      const { wrapper } = mountTabBar('first')

      await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })

      expect(document.activeElement).toBe(wrapper.get('[aria-label="Zweite"]').element)
    })

    it('ignores other keys', async () => {
      const { wrapper, selected } = mountTabBar('first')

      await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'a' })

      expect(selected).toEqual([])
    })
  })
})
