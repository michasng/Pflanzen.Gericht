import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SuggestionTextInput from '@/components/SuggestionTextInput.vue'

describe('SuggestionTextInput', () => {
  it('given the input is focused, shows matching suggestions', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: '', suggestions: ['Hafer', 'Palmöl'] },
    })

    await wrapper.get('input').trigger('focus')

    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual([
      'Hafer',
      'Palmöl',
    ])
    expect(wrapper.get('input').attributes('aria-controls')).toBeTruthy()
  })

  it('given text is typed, filters suggestions by substring', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: '', suggestions: ['Hafer', 'Palmöl'] },
    })

    await wrapper.get('input').trigger('focus')
    await wrapper.get('input').setValue('haf')
    const [[typedValue]] = wrapper.emitted('update:modelValue') as [[string]]
    await wrapper.setProps({ modelValue: typedValue })

    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['Hafer'])
  })

  it('given a suggestion is clicked, updates the model value and closes the list', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: '', suggestions: ['Hafer', 'Palmöl'] },
    })

    await wrapper.get('input').trigger('focus')
    await wrapper.get('[role="option"] button').trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')).toEqual([['Hafer']])
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
  })

  it('given no listbox is rendered, omits aria relationships to missing elements', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: 'Unbekannt', suggestions: ['Hafer', 'Palmöl'] },
    })

    const input = wrapper.get('input')

    expect(input.attributes('aria-controls')).toBeUndefined()
    expect(input.attributes('aria-activedescendant')).toBeUndefined()

    await input.trigger('focus')

    expect(input.attributes('aria-controls')).toBeUndefined()
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
  })

  it('given arrow down is pressed then enter, selects the highlighted suggestion', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: '', suggestions: ['Hafer', 'Palmöl'] },
    })

    await wrapper.get('input').trigger('focus')
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['Hafer']])
    expect(wrapper.emitted('enter')).toBeUndefined()
  })

  it('given the filtered suggestions shrink below the highlighted index, clears aria-activedescendant', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: '', suggestions: ['Hafer', 'Palmöl', 'Kakao'] },
    })

    const input = wrapper.get('input')

    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowUp' })

    expect(input.attributes('aria-activedescendant')).toBeTruthy()

    await input.setValue('haf')
    const [[typedValue]] = wrapper.emitted('update:modelValue') as [[string]]
    await wrapper.setProps({ modelValue: typedValue })

    expect(input.attributes('aria-activedescendant')).toBeUndefined()
  })

  it('given enter is pressed without a highlighted suggestion, emits enter', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: 'Neue Zutat', suggestions: ['Hafer'] },
    })

    await wrapper.get('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('enter')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('given suggestions are rendered, keeps their buttons out of the tab order', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: '', suggestions: ['Hafer', 'Palmöl'] },
    })

    await wrapper.get('input').trigger('focus')

    expect(
      wrapper.findAll('[role="option"] button').map((button) => button.attributes('tabindex')),
    ).toEqual(['-1', '-1'])
  })
})
