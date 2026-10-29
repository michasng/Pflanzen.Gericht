import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarDisplay from '../StarDisplay.vue'

describe('StarDisplay', () => {
  describe('given a fractional average score', () => {
    it('fills three stars and eighty percent of the fourth for 3.8', () => {
      const wrapper = mount(StarDisplay, { props: { value: 3.8 } })

      const fills = wrapper
        .findAll('linearGradient')
        .map((gradient) => Number.parseFloat(gradient.get('stop').attributes('offset') ?? ''))
      expect(fills).toHaveLength(5)
      expect(fills[0]).toBe(100)
      expect(fills[1]).toBe(100)
      expect(fills[2]).toBe(100)
      expect(fills[3]).toBeCloseTo(80)
      expect(fills[4]).toBe(0)
    })

    it('announces the score with a German decimal separator', () => {
      const wrapper = mount(StarDisplay, { props: { value: 3.8 } })

      expect(wrapper.get('span').attributes('aria-label')).toBe('3,8 von 5 Sternen')
    })
  })

  describe('given several ratings on the same page', () => {
    it('uses separate fill references for each star', () => {
      const wrapper = mount({
        components: { StarDisplay },
        template: '<div><StarDisplay :value="3.8" /><StarDisplay :value="1.5" /></div>',
      })

      const gradientIds = wrapper
        .findAll('linearGradient')
        .map((gradient) => gradient.attributes('id'))
      expect(new Set(gradientIds).size).toBe(10)
      expect(wrapper.findAll('svg').map((star) => star.attributes('fill'))).toEqual(
        gradientIds.map((id) => `url(#${id})`),
      )
    })
  })

  describe('given a score at or beyond the rating limits', () => {
    it.each([
      [-1, [0, 0, 0, 0, 0]],
      [5, [100, 100, 100, 100, 100]],
      [6, [100, 100, 100, 100, 100]],
    ])('keeps the star fills within bounds for %s', (value, expected) => {
      const wrapper = mount(StarDisplay, { props: { value } })

      const fills = wrapper
        .findAll('linearGradient')
        .map((gradient) => Number.parseFloat(gradient.get('stop').attributes('offset') ?? ''))
      expect(fills).toEqual(expected)
    })
  })

  it('renders 5 svg icons', () => {
    const wrapper = mount(StarDisplay, { props: { value: 3 } })
    expect(wrapper.findAll('svg')).toHaveLength(5)
  })

  it('highlights the correct number of stars', () => {
    const wrapper = mount(StarDisplay, { props: { value: 4 } })
    const highlighted = wrapper
      .findAll('linearGradient')
      .filter((gradient) => gradient.get('stop').attributes('offset') === '100%')
    expect(highlighted).toHaveLength(4)
  })

  it('shows all stars gray when value is null', () => {
    const wrapper = mount(StarDisplay, { props: { value: null } })
    const gray = wrapper
      .findAll('linearGradient')
      .filter((gradient) => gradient.get('stop').attributes('offset') === '0%')
    expect(gray).toHaveLength(5)
  })

  it('shows no highlighted stars when value is 0', () => {
    const wrapper = mount(StarDisplay, { props: { value: 0 } })
    const highlighted = wrapper
      .findAll('linearGradient')
      .filter((gradient) => gradient.get('stop').attributes('offset') !== '0%')
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
