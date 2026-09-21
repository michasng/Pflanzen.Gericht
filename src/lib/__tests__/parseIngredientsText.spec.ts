import { describe, it, expect } from 'vitest'
import { parseIngredientsText } from '../parseIngredientsText'

const ORGANIC_KEYWORDS_DE = ['bio', 'öko']
const ORGANIC_KEYWORDS_EN = ['organic', 'eco']

describe('parseIngredientsText', () => {
  it('given the german oat drink example, parses names, percent and organic markers, keeping bracketed qualifiers on the ingredient', () => {
    const text =
      'Wasser, HAFER* 10%, Rapsöl*, Meersalz, Säureregulator (Kaliumcarbonat). Ökologische Zutaten.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'HAFER (Bio)', fractionBasisPoints: 1000, comparator: '=' },
      { name: 'Rapsöl (Bio)', fractionBasisPoints: null, comparator: '=' },
      { name: 'Meersalz', fractionBasisPoints: null, comparator: '=' },
      { name: 'Säureregulator (Kaliumcarbonat)', fractionBasisPoints: null, comparator: '=' },
    ])
  })

  it('given the same list in english, parses it identically using english organic keywords', () => {
    const text =
      'Water, OAT* 10%, rapeseed oil, sea salt, acidity regulator (potassium carbonate). \r\n\r\n*Organic ingredients.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_EN)).toEqual([
      { name: 'Water', fractionBasisPoints: null, comparator: '=' },
      { name: 'OAT (Bio)', fractionBasisPoints: 1000, comparator: '=' },
      { name: 'rapeseed oil', fractionBasisPoints: null, comparator: '=' },
      { name: 'sea salt', fractionBasisPoints: null, comparator: '=' },
      {
        name: 'acidity regulator (potassium carbonate)',
        fractionBasisPoints: null,
        comparator: '=',
      },
    ])
  })

  it('given a name is all-caps to denote an allergen, keeps the casing unchanged', () => {
    const text = 'Wasser, HAFER 10%'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'HAFER', fractionBasisPoints: 1000, comparator: '=' },
    ])
  })

  it('given the text mentions the organic keyword case-insensitively, still marks starred ingredients as organic', () => {
    const text = 'Wasser, Hafer* 5%. BIO.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'Hafer (Bio)', fractionBasisPoints: 500, comparator: '=' },
    ])
  })

  it('given no organic keyword is present in the text, does not mark starred ingredients as organic', () => {
    const text = 'Wasser, Hafer* 5%.'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'Hafer', fractionBasisPoints: 500, comparator: '=' },
    ])
  })

  it('given a bracketed qualifier follows an ingredient, keeps it as a single ingredient name', () => {
    const text = 'Regulator (Kaliumcarbonat, Natriumcarbonat)'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      {
        name: 'Regulator (Kaliumcarbonat, Natriumcarbonat)',
        fractionBasisPoints: null,
        comparator: '=',
      },
    ])
  })

  it('given the text has no trailing sentence, still parses the ingredient list', () => {
    const text = 'Wasser, Zucker'

    expect(parseIngredientsText(text, ORGANIC_KEYWORDS_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'Zucker', fractionBasisPoints: null, comparator: '=' },
    ])
  })

  it('given the text is empty, returns an empty list', () => {
    expect(parseIngredientsText('', ORGANIC_KEYWORDS_DE)).toEqual([])
  })
})
