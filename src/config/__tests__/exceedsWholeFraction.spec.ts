import { describe, expect, it } from 'vitest'
import { exceedsWholeFraction } from '../exceedsWholeFraction'

describe('exceedsWholeFraction', () => {
  it('returns false at exactly 100 %', () => expect(exceedsWholeFraction(10000)).toBe(false))
  it('returns true above 100 %', () => expect(exceedsWholeFraction(10001)).toBe(true))
})
