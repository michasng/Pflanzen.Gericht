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

  it('given enter is pressed without a highlighted suggestion, emits enter', async () => {
    const wrapper = mount(SuggestionTextInput, {
      props: { modelValue: 'Neue Zutat', suggestions: ['Hafer'] },
    })

    await wrapper.get('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('enter')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
