import { describe, expect, it } from 'vitest'
import { resolveBaseFromIngredients } from '../resolveBaseFromIngredients.js'

describe('resolveBaseFromIngredients', () => {
  describe('given no ingredients', () => {
    it('returns null', () => {
      expect(resolveBaseFromIngredients(null)).toBeNull()
    })
  })

  describe('given several bases', () => {
    it('picks the one declared first, as it has the highest share', () => {
      const ingredients =
        'Wasser, HAFER(4,7%), geschälte SOJABOHNEN (2,1%), Sonnenblumenöl, Zucker, Calcium (Calciumcarbonat), Säureregulator (Kaliumphosphate), Meersalz, Aromen, Vitamine B2, D2. KANN ANDERE GLUTENHALTIGE GETREIDESORTEN ENTHALTEN.'

      expect(resolveBaseFromIngredients(ingredients)).toBe('oat')
    })
  })

  describe('given a base inside a compound word', () => {
    it('recognises it', () => {
      expect(resolveBaseFromIngredients('Wasser, Erbsenprotein 18%, Rapsöl')).toBe('pea')
    })
  })

  describe('given chickpeas', () => {
    it('does not mistake them for peas', () => {
      expect(resolveBaseFromIngredients('Kichererbsen 60%, Sesammus')).toBe('chickpea')
    })
  })

  describe('given a base only as additive or condiment', () => {
    it('ignores it', () => {
      expect(resolveBaseFromIngredients('Sojalecithin, Reissirup, Sojasoße, LUPINEN')).toBe('lupin')
    })
  })

  describe('given a plant fat', () => {
    it('picks the plant, as it is declared first', () => {
      expect(resolveBaseFromIngredients('Wasser, Kokosnussöl 21%, Ackerbohnenprotein 5%')).toBe(
        'coconut',
      )
    })
  })

  describe('given sugar', () => {
    it('picks sugar, ignoring the syrup declared before', () => {
      expect(resolveBaseFromIngredients('Glukosesirup, Zucker, Kokosöl')).toBe('sugar')
    })
  })

  describe('given sunflower seeds and sunflower oil', () => {
    it('picks the seeds, not the oil', () => {
      expect(resolveBaseFromIngredients('Sonnenblumenöl, Wasser, Sonnenblumenkerne')).toBe(
        'sunflower',
      )
    })
  })

  describe('given a base spelled with an umlaut', () => {
    it('recognises it', () => {
      expect(resolveBaseFromIngredients('HASELNÜSSE 22%, Rohrohrzucker')).toBe('hazelnut')
    })
  })

  describe('given English ingredients', () => {
    it('recognises the base', () => {
      expect(resolveBaseFromIngredients('76,7% PEANUTS, PEANUT OIL, sea salt')).toBe('peanut')
    })
  })

  describe('given a base only in a trace statement', () => {
    it('ignores it', () => {
      expect(resolveBaseFromIngredients('Kartoffeln, Salz. Kann Spuren von Soja enthalten.')).toBe(
        null,
      )
    })
  })

  describe('given words that merely contain a base keyword', () => {
    it('ignores them', () => {
      expect(
        resolveBaseFromIngredients(
          'Preiselbeeren, Buchweizen, Zuckermais, Polydextrose, Hanfsamen',
        ),
      ).toBe('hemp')
    })
  })
})
