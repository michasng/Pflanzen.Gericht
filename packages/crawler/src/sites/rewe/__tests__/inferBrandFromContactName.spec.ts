import { describe, expect, it } from 'vitest'
import { inferBrandFromContactName } from '../inferBrandFromContactName.js'

describe('inferBrandFromContactName', () => {
  describe('given a product name and contact name sharing the first word', () => {
    it('returns the shared word', () => {
      expect(
        inferBrandFromContactName(
          'Züger Filona Bio vegane Frischecreme Kräuter 150g',
          'Züger Frischkäse AG',
        ),
      ).toBe('Züger')
    })
  })

  describe('given several shared words', () => {
    it('returns the longest shared prefix', () => {
      expect(inferBrandFromContactName('Mush Roots Bio Pilze', 'Mush Roots GmbH')).toBe(
        'Mush Roots',
      )
    })
  })

  describe('given differing letter case', () => {
    it('keeps the spelling of the product name', () => {
      expect(inferBrandFromContactName('Züger Frischecreme', 'ZÜGER AG')).toBe('Züger')
    })
  })

  describe('given no shared prefix', () => {
    it('returns null', () => {
      expect(inferBrandFromContactName('Tofu Natur', 'Züger Frischkäse AG')).toBeNull()
    })
  })

  describe('given no contact name', () => {
    it('returns null', () => {
      expect(inferBrandFromContactName('Züger Frischecreme', null)).toBeNull()
    })
  })
})
