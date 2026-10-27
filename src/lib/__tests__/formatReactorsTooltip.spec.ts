import { describe, expect, it } from 'vitest'
import { createReviewReaction } from '@/__tests__/createReviewReaction'
import { formatReactorsTooltip } from '../formatReactorsTooltip'

const createReactors = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    createReviewReaction({
      userId: `user-${index}`,
      profile: { username: `name${index}`, displayName: null },
    }),
  )

describe('formatReactorsTooltip', () => {
  describe('given up to five reactors', () => {
    it('lists all names one per line', () => {
      expect(formatReactorsTooltip(createReactors(5))).toBe('name0\nname1\nname2\nname3\nname4')
    })
  })

  describe('given more than five reactors', () => {
    it('lists five names and counts the rest', () => {
      expect(formatReactorsTooltip(createReactors(6))).toBe(
        'name0\nname1\nname2\nname3\nname4\nund 1 weitere',
      )
    })
  })

  describe('given a display name', () => {
    it('prefers it over the username', () => {
      const reactor = createReviewReaction({
        profile: { username: 'alex', displayName: 'Alexandra' },
      })

      expect(formatReactorsTooltip([reactor])).toBe('Alexandra')
    })
  })
})
