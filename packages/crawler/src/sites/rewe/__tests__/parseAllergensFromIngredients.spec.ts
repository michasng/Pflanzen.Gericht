import { describe, expect, it } from 'vitest'
import { parseAllergensFromIngredients } from '../parseAllergensFromIngredients.js'

describe('parseAllergensFromIngredients', () => {
  describe('given a capitalized compound cereal', () => {
    it('detects gluten', () => {
      expect(
        parseAllergensFromIngredients(
          'Wasser, VOLLKORNHAFER* glutenfrei 11 %, Sonnenblumenöl*, Meersalz',
        ),
      ).toEqual(['gluten'])
    })
  })

  describe('given a capitalized cereal at the start of a word', () => {
    it('detects gluten', () => {
      expect(parseAllergensFromIngredients('WEIZENMEHL, Wasser')).toEqual(['gluten'])
    })
  })

  describe('given a lowercase cereal', () => {
    it('detects nothing', () => {
      expect(parseAllergensFromIngredients('Vollkornhafer, glutenfrei')).toEqual([])
    })
  })

  describe('given a capitalized soy compound', () => {
    it('detects soy', () => {
      expect(parseAllergensFromIngredients('Wasser, BIOSOJABOHNEN')).toEqual(['soy'])
    })
  })

  describe('given capitalized nuts', () => {
    it('detects nuts', () => {
      expect(parseAllergensFromIngredients('HASELNÜSSE, Zucker')).toEqual(['nuts'])
    })
  })

  describe('given a capitalized coconut', () => {
    it('does not detect nuts', () => {
      expect(parseAllergensFromIngredients('KOKOSNUSS, Zucker')).toEqual([])
    })
  })
})
