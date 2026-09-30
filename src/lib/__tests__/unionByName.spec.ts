import { describe, expect, it } from 'vitest'
import { unionByName } from '../unionByName'

describe('unionByName', () => {
  describe('given lists sharing a name up to case and whitespace', () => {
    it('keeps the first occurrence only', () => {
      const first = [{ name: 'Hafer', value: 1 }]
      const second = [
        { name: ' hafer ', value: 2 },
        { name: 'Salz', value: 3 },
      ]

      expect(unionByName(first, second)).toEqual([
        { name: 'Hafer', value: 1 },
        { name: 'Salz', value: 3 },
      ])
    })
  })
})
