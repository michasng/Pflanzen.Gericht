import { describe, expect, it } from 'vitest'
import { toPageRange } from '@/lib/toPageRange'

describe('toPageRange', () => {
  describe('given the first page', () => {
    it('starts at zero and ends at the last index of the page', () => {
      expect(toPageRange({ page: 0, pageSize: 20 })).toEqual([0, 19])
    })
  })

  describe('given a later page', () => {
    it('starts right after the previous page', () => {
      expect(toPageRange({ page: 2, pageSize: 10 })).toEqual([20, 29])
    })
  })
})
