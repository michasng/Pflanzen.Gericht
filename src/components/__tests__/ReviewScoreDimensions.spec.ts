import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReviewScoreDimensions from '../ReviewScoreDimensions.vue'

describe('ReviewScoreDimensions', () => {
  describe('given scores are provided', () => {
    it('renders each score label and value', () => {
      const wrapper = mount(ReviewScoreDimensions, {
        props: {
          scores: [
            { label: 'Geschmack', value: 4.5 },
            { label: 'Konsistenz', value: 3.5 },
          ],
        },
      })

      expect(wrapper.text()).toContain('Geschmack')
      expect(wrapper.text()).toContain('4.5')
      expect(wrapper.text()).toContain('Konsistenz')
      expect(wrapper.text()).toContain('3.5')
    })
  })
})
