import { describe, expect, it } from 'vitest'
import { formatReactionCount } from '../formatReactionCount'

describe('formatReactionCount', () => {
  it.each([
    [0, ''],
    [1, ''],
    [2, '2'],
    [99, '99'],
    [100, '99+'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(formatReactionCount(count)).toBe(expected)
  })
})
