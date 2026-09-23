import { describe, it, expect } from 'vitest'
import { mapOpenFoodFactsProductToFormValues } from '../mapOpenFoodFactsProductToFormValues'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'

describe('mapOpenFoodFactsProductToFormValues', () => {
  it('given a product has no data at all, returns an empty object', () => {
    expect(mapOpenFoodFactsProductToFormValues({})).toEqual({})
  })

  it('given a product has a name and brand, maps them and uses only the first brand', () => {
    const product: OpenFoodFactsProduct = {
      product_name: 'Soja-Drink Original',
      brands: 'Alpro,Danone',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.name).toBe('Soja-Drink Original')
    expect(values.brand).toBe('Alpro')
  })

  it('given a product has a german and an english name, prefers the german name', () => {
    const product: OpenFoodFactsProduct = {
      product_name: 'Soja Drink',
      product_name_de: 'Soja-Drink Original',
      product_name_en: 'Soy Drink Original',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.name).toBe('Soja-Drink Original')
  })

  it('given a product has no german name but an english name, prefers the english name', () => {
    const product: OpenFoodFactsProduct = {
      product_name: 'Soja Drink',
      product_name_en: 'Soy Drink Original',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.name).toBe('Soy Drink Original')
  })

  it('given a product has no german or english name, falls back to the generic name', () => {
    const product: OpenFoodFactsProduct = { product_name: 'Soja Drink' }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.name).toBe('Soja Drink')
  })

  it('given a product has a german and an english generic name, prefers the german generic name', () => {
    const product: OpenFoodFactsProduct = {
      generic_name: 'Soja Drink',
      generic_name_de: 'Soja-Drink Original',
      generic_name_en: 'Soy Drink Original',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.description).toBe('Soja-Drink Original')
  })

  it('given a product has no german generic name but an english generic name, prefers the english generic name', () => {
    const product: OpenFoodFactsProduct = {
      generic_name: 'Soja Drink',
      generic_name_en: 'Soy Drink Original',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.description).toBe('Soy Drink Original')
  })

  it('given a product has no german or english generic name, falls back to the generic name', () => {
    const product: OpenFoodFactsProduct = { generic_name: 'Soja Drink' }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.description).toBe('Soja Drink')
  })

  it('given a product has no generic name at all, leaves the description blank', () => {
    const product: OpenFoodFactsProduct = { ingredients_text: 'Wasser, Sojabohnen' }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.description).toBeUndefined()
  })

  it('given energy is present in kJ, converts it to joules', () => {
    const product: OpenFoodFactsProduct = { nutriments: { 'energy-kj_100g': 250 } }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.energyJoules).toBe(250_000)
  })

  it('given allergen tags are known, maps them to allergens and ignores unknown tags', () => {
    const product: OpenFoodFactsProduct = {
      allergens_tags: ['en:gluten', 'en:soybeans', 'en:unknown-thing'],
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.allergens).toEqual(['gluten', 'soy'])
  })

  it('given labels include organic, marks the product as organic', () => {
    const product: OpenFoodFactsProduct = { labels_tags: ['en:organic'] }

    expect(mapOpenFoodFactsProductToFormValues(product).isOrganic).toBe(true)
  })

  it('given labels do not include organic, does not set isOrganic', () => {
    const product: OpenFoodFactsProduct = { labels_tags: ['en:vegan'] }

    expect(mapOpenFoodFactsProductToFormValues(product).isOrganic).toBeUndefined()
  })

  it('given ingredients have a percent estimate, maps name and fraction basis points', () => {
    const product: OpenFoodFactsProduct = {
      ingredients: [
        { text: 'Wasser', percent_estimate: 60 },
        { text: 'Sojabohnen', percent_estimate: 8.5 },
        { text: '  ' },
      ],
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
      { name: 'Wasser', fractionBasisPoints: 6000, comparator: '=' },
      { name: 'Sojabohnen', fractionBasisPoints: 850, comparator: '=' },
    ])
  })

  it('given an ingredient is labelled organic, appends the organic suffix to its name', () => {
    const product: OpenFoodFactsProduct = {
      lang: 'de',
      ingredients: [
        { text: 'Hafer', percent_estimate: 10, labels: 'en:organic' },
        { text: 'Wasser', percent_estimate: 60 },
      ],
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
      { name: 'Hafer (Bio)', fractionBasisPoints: 1000, comparator: '=' },
      { name: 'Wasser', fractionBasisPoints: 6000, comparator: '=' },
    ])
  })

  it('given the product language is not german but a german ingredients text exists, parses the german text instead of the structured ingredients', () => {
    const product: OpenFoodFactsProduct = {
      lang: 'nl',
      ingredients: [{ text: 'HAVER 10% koolzaadolie', percent_estimate: 18.44 }],
      ingredients_text_de:
        'Wasser, HAFER* 10%, Rapsöl*, Meersalz, Säureregulator (Kaliumcarbonat). Ökologische Zutaten.',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'HAFER (Bio)', fractionBasisPoints: 1000, comparator: '=' },
      { name: 'Rapsöl (Bio)', fractionBasisPoints: null, comparator: '=' },
      { name: 'Meersalz', fractionBasisPoints: null, comparator: '=' },
      { name: 'Säureregulator (Kaliumcarbonat)', fractionBasisPoints: null, comparator: '=' },
    ])
  })

  it('given the product language is english and no german text exists, uses the structured english ingredients', () => {
    const product: OpenFoodFactsProduct = {
      lang: 'en',
      ingredients: [
        { text: 'Water', percent_estimate: 60 },
        { text: 'Oat', percent_estimate: 10, labels: 'en:organic' },
      ],
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
      { name: 'Water', fractionBasisPoints: 6000, comparator: '=' },
      { name: 'Oat (Bio)', fractionBasisPoints: 1000, comparator: '=' },
    ])
  })

  it('given neither german structured data nor german text exists and the product language is not english, parses the english text as a fallback', () => {
    const product: OpenFoodFactsProduct = {
      lang: 'nl',
      ingredients: [{ text: 'HAVER 10% koolzaadolie', percent_estimate: 18.44 }],
      ingredients_text_en:
        'Water, OAT* 10%, rapeseed oil, sea salt, acidity regulator (potassium carbonate). \r\n\r\n*Organic ingredients.',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
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

  it('given a german ingredients text parses to no entries, falls back to the english structured ingredients', () => {
    const product: OpenFoodFactsProduct = {
      lang: 'en',
      ingredients: [
        { text: 'Water', percent_estimate: 60 },
        { text: 'Oat', percent_estimate: 10, labels: 'en:organic' },
      ],
      ingredients_text_de: ' . ',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
      { name: 'Water', fractionBasisPoints: 6000, comparator: '=' },
      { name: 'Oat (Bio)', fractionBasisPoints: 1000, comparator: '=' },
    ])
  })

  it('given the barista oat drink product from open food facts, parses the german ingredients text', () => {
    const product: OpenFoodFactsProduct = {
      lang: 'nl',
      ingredients: [
        { text: 'Water', percent_estimate: 59.9 },
        { text: 'HAVER 10% koolzaadolie', percent_estimate: 18.44, labels: 'en:organic' },
        { text: 'zeezout', percent_estimate: 9.25 },
        { text: 'zuurte', percent_estimate: 5.67 },
        { text: 'regelaar', percent_estimate: 3.88 },
        { text: 'ingrediënt', percent_estimate: 2.85 },
      ],
      ingredients_text:
        'Water, HAVER* 10% koolzaadolie, zeezout, zuurte - regelaar (kaliumcarbonaat). \r\n\r\n*Biologisch ingrediënt.',
      ingredients_text_de:
        'Wasser, HAFER* 10%, Rapsöl*, Meersalz, Säureregulator (Kaliumcarbonat). Ökologische Zutaten.',
      ingredients_text_en:
        'Water, OAT* 10%, rapeseed oil, sea salt, acidity regulator (potassium carbonate). \r\n\r\n*Organic ingredients.',
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.ingredients).toEqual([
      { name: 'Wasser', fractionBasisPoints: null, comparator: '=' },
      { name: 'HAFER (Bio)', fractionBasisPoints: 1000, comparator: '=' },
      { name: 'Rapsöl (Bio)', fractionBasisPoints: null, comparator: '=' },
      { name: 'Meersalz', fractionBasisPoints: null, comparator: '=' },
      { name: 'Säureregulator (Kaliumcarbonat)', fractionBasisPoints: null, comparator: '=' },
    ])
  })

  it('given known nutrient fields are present, maps them, sorts by hierarchy and keeps unmapped ones with english fallback names', () => {
    const product: OpenFoodFactsProduct = {
      nutriments: {
        sugars_100g: 3,
        fat_100g: 3.5,
        'unmapped-field_100g': 42,
      },
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.nutrients).toEqual([
      { name: 'Fett', amountMicrograms: 3_500_000 },
      { name: 'Zucker', amountMicrograms: 3_000_000 },
      { name: 'Unmapped Field', amountMicrograms: 42_000_000 },
    ])
  })

  it('given added sugars are present, translates them to german and sorts them after sugars', () => {
    const product: OpenFoodFactsProduct = {
      nutriments: {
        'added-sugars_100g': 2,
        sugars_100g: 3,
      },
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.nutrients).toEqual([
      { name: 'Zucker', amountMicrograms: 3_000_000 },
      { name: 'Zugesetzter Zucker', amountMicrograms: 2_000_000 },
    ])
  })

  it('given nutriments contain an estimate segment, does not use them to populate the form', () => {
    const product: OpenFoodFactsProduct = {
      nutriments: {
        'fruits-vegetables-legumes-estimate-from-ingredients_100g': 20,
        'fruits-vegetables-nuts-estimate-from-ingredients_100g': 10,
        'cocoa-estimate_100g': 5,
        fiber_100g: 3,
      },
    }

    expect(mapOpenFoodFactsProductToFormValues(product).nutrients).toEqual([
      { name: 'Ballaststoffe', amountMicrograms: 3_000_000 },
    ])
  })

  it('given additional nutriments use supported units, maps them with fallback english names', () => {
    const product: OpenFoodFactsProduct = {
      nutriments: {
        calcium_100g: 120,
        calcium_unit: 'mg',
        'vitamin-c_100g': 30,
        'vitamin-c_unit': 'mg',
        'vitamin-b12_100g': 2.5,
        'vitamin-b12_unit': 'µg',
      },
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.nutrients).toEqual([
      { name: 'Calcium', amountMicrograms: 120_000 },
      { name: 'Vitamin B12', amountMicrograms: 3 },
      { name: 'Vitamin C', amountMicrograms: 30_000 },
    ])
  })

  it('given a nutriment uses an unsupported unit, skips it instead of guessing', () => {
    const product: OpenFoodFactsProduct = {
      nutriments: {
        'vitamin-d_100g': 40,
        'vitamin-d_unit': 'IU',
      },
    }

    expect(mapOpenFoodFactsProductToFormValues(product).nutrients).toBeUndefined()
  })
})
