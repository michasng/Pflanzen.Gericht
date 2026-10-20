import { describe, expect, it } from 'vitest'
import { buildIngredientRows } from '../buildIngredientRows.js'

describe('buildIngredientRows', () => {
  describe('given ingredients text with several ingredients', () => {
    it('numbers the rows in label order', () => {
      const rows = buildIngredientRows('Zucker, Wasser 10%, Salz', 'product-1')

      expect(rows.map(({ name, sort_order }) => [name, sort_order])).toEqual([
        ['Zucker', 0],
        ['Wasser', 1],
        ['Salz', 2],
      ])
    })

    it('assigns every row to the product', () => {
      const rows = buildIngredientRows('Zucker, Salz', 'product-1')

      expect(rows.map((row) => row.product_id)).toEqual(['product-1', 'product-1'])
    })
  })

  describe('given no ingredients text', () => {
    it('returns no rows', () => {
      expect(buildIngredientRows(null, 'product-1')).toEqual([])
    })
  })
})
