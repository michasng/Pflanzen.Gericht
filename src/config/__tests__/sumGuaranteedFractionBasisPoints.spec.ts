import { describe, expect, it } from 'vitest'
import { sumGuaranteedFractionBasisPoints } from '../sumGuaranteedFractionBasisPoints'

describe('sumGuaranteedFractionBasisPoints', () => {
  it('sums fractions with minimum-guaranteed comparators', () => {
    const total = sumGuaranteedFractionBasisPoints([
      { name: 'A', fractionBasisPoints: 6000, comparator: '=' },
      { name: 'B', fractionBasisPoints: 5000, comparator: '≥' },
    ])
    expect(total).toBe(11000)
  })

  it('ignores upper-bound comparators and missing fractions', () => {
    const total = sumGuaranteedFractionBasisPoints([
      { name: 'A', fractionBasisPoints: 9000, comparator: '≤' },
      { name: 'B', fractionBasisPoints: null, comparator: '=' },
    ])
    expect(total).toBe(0)
  })
})
