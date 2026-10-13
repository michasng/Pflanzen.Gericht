import { describe, expect, it } from 'vitest'
import { buildPaginatedUrl } from '../buildPaginatedUrl.js'

describe('buildPaginatedUrl', () => {
  describe('given a listing URL with a filter', () => {
    it('keeps the filter and adds the page', () => {
      expect(buildPaginatedUrl('https://www.rewe.de/shop/c/a/?attribute=vegan', 2)).toBe(
        'https://www.rewe.de/shop/c/a/?attribute=vegan&page=2',
      )
    })
  })

  describe('given a listing URL that already has a page', () => {
    it('replaces the page', () => {
      expect(buildPaginatedUrl('https://www.rewe.de/shop/c/a/?page=2', 3)).toBe(
        'https://www.rewe.de/shop/c/a/?page=3',
      )
    })
  })
})
