import { describe, expect, it } from 'vitest'
import { resolveCategoryFromKeywords } from '../categoryKeywordMapping.js'

describe('resolveCategoryFromKeywords', () => {
  it('given breadcrumbs mentioning protein bars/sports nutrition, maps to sweets', () => {
    expect(resolveCategoryFromKeywords(['Sportnahrung', 'Proteinriegel Schoko'])).toBe('sweets')
  })

  it('given a sausage-like product name, maps to sausage rather than meat', () => {
    expect(resolveCategoryFromKeywords(['Vegane Bratwurst'])).toBe('sausage')
  })

  it('given a nut butter name, maps to spread', () => {
    expect(resolveCategoryFromKeywords(['KoRo Bio Erdnussmus 500g'])).toBe('spread')
  })

  it('given a margarine name, maps to butter', () => {
    expect(resolveCategoryFromKeywords(['Rama Margarine'])).toBe('butter')
  })

  it('given a quark name, maps to cheese', () => {
    expect(resolveCategoryFromKeywords(['Bio Naturquark Alternative'])).toBe('cheese')
  })

  it('given no matching keywords, returns null instead of defaulting to other', () => {
    expect(resolveCategoryFromKeywords(['Obst & Gemüse', 'Bio Apfel'])).toBeNull()
  })

  it('given null/undefined entries mixed with text, ignores the empty ones', () => {
    expect(resolveCategoryFromKeywords([null, undefined, 'Hafermilch Barista'])).toBe('milk')
  })
})
