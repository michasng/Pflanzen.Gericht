import { describe, expect, it } from 'vitest'
import { removeTrailingQuantity } from '../removeTrailingQuantity.js'

describe('removeTrailingQuantity', () => {
  describe('given a name ending with a comma-separated size', () => {
    it('removes the comma and size', () => {
      expect(removeTrailingQuantity('Haferdrink Barista Caramel, 1 l')).toBe(
        'Haferdrink Barista Caramel',
      )
    })
  })

  describe('given a name ending with a size without space', () => {
    it('removes the size', () => {
      expect(removeTrailingQuantity('KoRo Bio Erdnussmus 500g')).toBe('KoRo Bio Erdnussmus')
    })
  })

  describe('given a size before other words', () => {
    it('keeps the name unchanged', () => {
      expect(removeTrailingQuantity('Tofu 200g Natur')).toBe('Tofu 200g Natur')
    })
  })

  describe('given a number that is part of a word', () => {
    it('keeps the name unchanged', () => {
      expect(removeTrailingQuantity('Vitamin B12 g')).toBe('Vitamin B12 g')
    })
  })

  describe('given a name without size', () => {
    it('keeps the name unchanged', () => {
      expect(removeTrailingQuantity('Alpro Haferdrink')).toBe('Alpro Haferdrink')
    })
  })
})
