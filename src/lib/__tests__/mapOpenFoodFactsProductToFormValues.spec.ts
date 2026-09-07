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

  it('given a product has no generic name, falls back to the ingredients text as description', () => {
    const product: OpenFoodFactsProduct = { ingredients_text: 'Wasser, Sojabohnen' }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.description).toBe('Wasser, Sojabohnen')
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

  it('given known nutrient fields are present, maps them to their German names in micrograms', () => {
    const product: OpenFoodFactsProduct = {
      nutriments: {
        fat_100g: 3.5,
        sugars_100g: 3,
        'unmapped-field_100g': 42,
      },
    }

    const values = mapOpenFoodFactsProductToFormValues(product)

    expect(values.nutrients).toEqual([
      { name: 'Fett', amountMicrograms: 3_500_000 },
      { name: 'Zucker', amountMicrograms: 3_000_000 },
    ])
  })
})
