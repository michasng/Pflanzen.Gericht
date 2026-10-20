import { describe, it, expect } from 'vitest'
import { ORGANIC_KEYWORDS_DE, ORGANIC_KEYWORDS_EN } from '../organicIngredients.js'
import { parseIngredientsText } from '../parseIngredientsText.js'

describe('parseIngredientsText', () => {
  it('given the german oat drink example, parses names, percent and organic markers, keeping bracketed qualifiers on the ingredient', () => {
    const text =
      'Wasser, HAFER* 10%, Rapsöl*, Meersalz, Säureregulator (Kaliumcarbonat). Ökologische Zutaten.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'HAFER (Bio)', fractionBasisPoints: 1000 },
      { name: 'Rapsöl (Bio)', fractionBasisPoints: null },
      { name: 'Meersalz', fractionBasisPoints: null },
      { name: 'Säureregulator (Kaliumcarbonat)', fractionBasisPoints: null },
    ])
  })

  it('given the same list in english, parses it identically using english organic keywords', () => {
    const text =
      'Water, OAT* 10%, rapeseed oil, sea salt, acidity regulator (potassium carbonate). \r\n\r\n*Organic ingredients.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_EN)).toEqual([
      { name: 'Water', fractionBasisPoints: null },
      { name: 'OAT (Bio)', fractionBasisPoints: 1000 },
      { name: 'rapeseed oil', fractionBasisPoints: null },
      { name: 'sea salt', fractionBasisPoints: null },
      {
        name: 'acidity regulator (potassium carbonate)',
        fractionBasisPoints: null,
      },
    ])
  })

  it('given a name is all-caps to denote an allergen, keeps the casing unchanged', () => {
    const text = 'Wasser, HAFER 10%'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'HAFER', fractionBasisPoints: 1000 },
    ])
  })

  it('given the text mentions the organic keyword case-insensitively, still marks starred ingredients as organic', () => {
    const text = 'Wasser, Hafer* 5%. BIO.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer (Bio)', fractionBasisPoints: 500 },
    ])
  })

  it('given an ingredient contains bio in the ingredient list, does not treat it as the organic footnote', () => {
    const text = 'Wasser, Hafer* 5%, Biotin.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer', fractionBasisPoints: 500 },
      { name: 'Biotin', fractionBasisPoints: null },
    ])
  })

  it('given no organic keyword is present in the text, does not mark starred ingredients as organic', () => {
    const text = 'Wasser, Hafer* 5%.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer', fractionBasisPoints: 500 },
    ])
  })

  it('given a bracketed qualifier follows an ingredient, keeps it as a single ingredient name', () => {
    const text = 'Regulator (Kaliumcarbonat, Natriumcarbonat)'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      {
        name: 'Regulator (Kaliumcarbonat, Natriumcarbonat)',
        fractionBasisPoints: null,
      },
    ])
  })

  it('given the text has no trailing sentence, still parses the ingredient list', () => {
    const text = 'Wasser, Zucker'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Zucker', fractionBasisPoints: null },
    ])
  })

  it('given an ingredient uses a decimal percentage, keeps the decimal part', () => {
    const text = 'Wasser, Hafer 2.5%.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer', fractionBasisPoints: 250 },
    ])
  })

  it('given the text is empty, returns an empty list', () => {
    expect(parseIngredientsText('', ORGANIC_KEYWORDS_DE)).toEqual([])
  })

  it('given a compound ingredient with its own percentage, keeps its sub-ingredients as a qualifier', () => {
    const text =
      'SOJADRINK* 72% (Wasser, SOJABOHNEN* 14%), MANDELMUS* 18%, Kokosnussöl*, Tapiokastärke*, Salz, Stabilisator: Johannisbrotkernmehl*, Xanthan, Kulturen.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'SOJADRINK (Wasser, SOJABOHNEN 14%)', fractionBasisPoints: 7200 },
      { name: 'MANDELMUS', fractionBasisPoints: 1800 },
      { name: 'Kokosnussöl', fractionBasisPoints: null },
      { name: 'Tapiokastärke', fractionBasisPoints: null },
      { name: 'Salz', fractionBasisPoints: null },
      { name: 'Stabilisator: Johannisbrotkernmehl', fractionBasisPoints: null },
      { name: 'Xanthan', fractionBasisPoints: null },
      { name: 'Kulturen', fractionBasisPoints: null },
    ])
  })

  it('given several bracketed qualifiers, splits only at top-level commas', () => {
    const text =
      'Wasser, HAFER 10%, Rapsöl, Säureregulator (Dikaliumphosphat), Mineralien (Calciumcarbonat, Kaliumiodid), Salz, Vitamine (D2, Riboflavin, B12).'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'HAFER', fractionBasisPoints: 1000 },
      { name: 'Rapsöl', fractionBasisPoints: null },
      { name: 'Säureregulator (Dikaliumphosphat)', fractionBasisPoints: null },
      { name: 'Mineralien (Calciumcarbonat, Kaliumiodid)', fractionBasisPoints: null },
      { name: 'Salz', fractionBasisPoints: null },
      { name: 'Vitamine (D2, Riboflavin, B12)', fractionBasisPoints: null },
    ])
  })
})
