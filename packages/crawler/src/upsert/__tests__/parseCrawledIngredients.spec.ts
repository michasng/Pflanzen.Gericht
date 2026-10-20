import { describe, expect, it } from 'vitest'
import { parseCrawledIngredients } from '../parseCrawledIngredients.js'

describe('parseCrawledIngredients', () => {
  it('given a raw ingredient list, returns one record per top-level ingredient', () => {
    const records = parseCrawledIngredients('SOJADRINK* 72% (Wasser, SOJABOHNEN* 14%), Salz.')

    expect(records).toEqual([
      {
        name: 'SOJADRINK (Wasser, SOJABOHNEN 14%)',
        comparator: '=',
        fraction_basis_points: 7200,
      },
      { name: 'Salz', comparator: '=', fraction_basis_points: null },
    ])
  })

  it('given a german organic footnote, marks starred ingredients as organic', () => {
    const records = parseCrawledIngredients('Wasser, HAFER* 10%. *aus ökologischem Anbau')

    expect(records).toEqual([
      { name: 'Wasser', comparator: '=', fraction_basis_points: null },
      { name: 'HAFER (Bio)', comparator: '=', fraction_basis_points: 1000 },
    ])
  })
})
